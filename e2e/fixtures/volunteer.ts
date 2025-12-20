import {
  type Prisma,
  type VolunteerActivity,
  VolunteerActivityStatus,
} from "@prisma/client";
import { test as authTest } from "./auth";

type VolunteerFixtures = {
  publishedActivity: VolunteerActivity;
  draftActivity: VolunteerActivity;
  createVolunteerActivity: (
    organiserId: string,
    overrides?: Partial<Prisma.VolunteerActivityCreateInput>,
  ) => Promise<VolunteerActivity>;
};

export const test = authTest.extend<VolunteerFixtures>({
  createVolunteerActivity: async ({ db }, use) => {
    const activities: VolunteerActivity[] = [];

    const factory = async (
      organiserId: string,
      overrides: Partial<Prisma.VolunteerActivityCreateInput> = {},
    ) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 9);

      // Default Date Logic: Start in 1 hour, end in 3 hours
      const defaultStart = new Date();
      defaultStart.setHours(defaultStart.getHours() + 1);
      defaultStart.setSeconds(0, 0);

      const defaultEnd = new Date(defaultStart);
      defaultEnd.setHours(defaultEnd.getHours() + 2);

      const activity = await db.volunteerActivity.create({
        data: {
          title: `Volunteer Activity ${timestamp}-${random}`,
          description: "Test Description",
          headcount: 5,
          location: `Test Location ${timestamp}-${random}`,
          startDateTime: defaultStart,
          endDateTime: defaultEnd,
          status: VolunteerActivityStatus.PUBLISHED,
          organiser: { connect: { id: organiserId } },
          ...overrides, // User overrides apply last
        },
      });

      activities.push(activity);
      return activity;
    };

    await use(factory);

    // Cleanup
    for (const activity of activities) {
      await db.volunteerActivity
        .delete({ where: { id: activity.id } })
        .catch(() => {});
    }
  },

  publishedActivity: async ({ testUser, createVolunteerActivity }, use) => {
    const activity = await createVolunteerActivity(testUser.id, {
      status: VolunteerActivityStatus.PUBLISHED,
    });
    await use(activity);
  },

  draftActivity: async ({ testUser, createVolunteerActivity }, use) => {
    const activity = await createVolunteerActivity(testUser.id, {
      status: VolunteerActivityStatus.DRAFT,
    });
    await use(activity);
  },
});
