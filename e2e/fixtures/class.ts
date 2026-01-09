import { type ClassActivity, ClassActivityStatus } from "@prisma/client";
import { test as authTest } from "./auth";

type ClassFixtures = {
  createClassActivity: (
    organiserId: string,
    overrides?: Partial<ClassActivity>,
  ) => Promise<ClassActivity>;
  publishedClassActivity: ClassActivity;
};

export const test = authTest.extend<ClassFixtures>({
  createClassActivity: async ({ db }, use) => {
    const activities: ClassActivity[] = [];

    const factory = async (
      organiserId: string,
      overrides: Partial<ClassActivity> = {},
    ) => {
      const timestamp = Date.now();

      const startDateTime = new Date();
      startDateTime.setHours(startDateTime.getHours() + 1);
      startDateTime.setSeconds(0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2);

      const activity = await db.classActivity.create({
        data: {
          title: "中級部", // Use a valid title from CLASS_ACTIVITY_TITLES
          location: "天一聖道院",
          description: `Test Description ${timestamp}`,
          startDateTime,
          endDateTime,
          status: ClassActivityStatus.PUBLISHED,
          organiserId,
          ...overrides,
        },
      });

      activities.push(activity);
      return activity;
    };

    await use(factory);

    // Cleanup
    for (const activity of activities) {
      await db.classActivity
        .delete({ where: { id: activity.id } })
        .catch(() => {});
    }
  },

  publishedClassActivity: async ({ testUser, createClassActivity }, use) => {
    const activity = await createClassActivity(testUser.id, {
      status: ClassActivityStatus.PUBLISHED,
    });
    await use(activity);
  },
});
