import {
  type EtogetherActivity,
  EtogetherActivityStatus,
  type EtogetherActivitySubgroup,
} from "@prisma/client";
import { test as authTest } from "./auth";

type EtogetherFixtures = {
  publishedEtogetherActivity: EtogetherActivity & {
    subgroups: EtogetherActivitySubgroup[];
  };
  draftEtogetherActivity: EtogetherActivity & {
    subgroups: EtogetherActivitySubgroup[];
  };
  createEtogetherActivity: (
    organiserId: string,
    status?: EtogetherActivityStatus,
    subgroupCount?: number,
  ) => Promise<
    EtogetherActivity & {
      subgroups: EtogetherActivitySubgroup[];
    }
  >;
};

export const test = authTest.extend<EtogetherFixtures>({
  createEtogetherActivity: async ({ db }, use) => {
    const activities: Array<
      EtogetherActivity & {
        subgroups: EtogetherActivitySubgroup[];
      }
    > = [];

    const factory = async (
      organiserId: string,
      status: EtogetherActivityStatus = EtogetherActivityStatus.PUBLISHED,
      subgroupCount = 1,
    ) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 9);

      const startDateTime = new Date();
      startDateTime.setMinutes(startDateTime.getMinutes() + 60);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2);

      const activity = await db.etogetherActivity.create({
        data: {
          title: `E-together Activity ${timestamp}-${random}`,
          description: "Test Description",
          location: `Test Location ${timestamp}-${random}`,
          startDateTime,
          endDateTime,
          status,
          organiserId,
          subgroups: {
            create: Array.from({ length: subgroupCount }, (_, i) => ({
              title: `Group ${i + 1}`,
              description: `Description for Group ${i + 1}`,
            })),
          },
        },
        include: {
          subgroups: true,
        },
      });

      activities.push(activity);
      return activity;
    };

    await use(factory);

    // Cleanup: delete all created activities
    for (const activity of activities) {
      await db.etogetherActivity
        .delete({ where: { id: activity.id } })
        .catch(() => {});
    }
  },

  publishedEtogetherActivity: async (
    { db, testUser, createEtogetherActivity },
    use,
  ) => {
    const activity = await createEtogetherActivity(
      testUser.id,
      EtogetherActivityStatus.PUBLISHED,
      1,
    );

    await use(activity);

    // Cleanup handled by createEtogetherActivity factory
  },

  draftEtogetherActivity: async (
    { db, testUser, createEtogetherActivity },
    use,
  ) => {
    const activity = await createEtogetherActivity(
      testUser.id,
      EtogetherActivityStatus.DRAFT,
      1,
    );

    await use(activity);

    // Cleanup handled by createEtogetherActivity factory
  },
});
