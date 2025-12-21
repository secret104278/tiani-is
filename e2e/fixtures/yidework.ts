import {
  Role,
  type User,
  type YideWorkActivity,
  YideWorkActivityStatus,
} from "@prisma/client";
import _ from "lodash";
import { test as base } from "./auth";

type YideWorkFixtures = {
  testYideWorkAdmin: User;
  loginAsYideWorkAdmin: User;
  createYideWorkActivity: (
    organiserId: string,
    overrides?: Partial<YideWorkActivity>,
  ) => Promise<YideWorkActivity>;
};

export const test = base.extend<YideWorkFixtures>({
  testYideWorkAdmin: async ({ createUser }, use) => {
    const user = await createUser([Role.YIDEWORK_ADMIN]);
    await use(user);
  },

  loginAsYideWorkAdmin: async (
    { page, context, db, testYideWorkAdmin },
    use,
  ) => {
    // Ensure locations exist
    await db.yideWorkLocation
      .upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: "天一聖道院" },
      })
      .catch(() => {});

    // Create session in DB
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sessionToken = `session-${timestamp}-${random}`;

    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    await db.session.create({
      data: {
        sessionToken,
        userId: testYideWorkAdmin.id,
        expires,
      },
    });

    // Inject cookies
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: sessionToken,
        url: "http://127.0.0.1:3100",
        httpOnly: true,
        sameSite: "Lax",
        expires: expires.getTime() / 1000,
      },
      {
        name: "authjs.session-token",
        value: sessionToken,
        url: "http://127.0.0.1:3100",
        httpOnly: true,
        sameSite: "Lax",
        expires: expires.getTime() / 1000,
      },
    ]);

    await use(testYideWorkAdmin);

    // Cleanup: delete the session
    await db.session.delete({ where: { sessionToken } }).catch(() => {});
  },

  createYideWorkActivity: async ({ db }, use) => {
    const activities: YideWorkActivity[] = [];

    const factory = async (
      organiserId: string,
      overrides?: Partial<YideWorkActivity>,
    ) => {
      const timestamp = Date.now();

      const activity = await db.yideWorkActivity.create({
        data: {
          title: `辦道 ${timestamp}`,
          description: "Test Description",
          startDateTime: new Date(),
          endDateTime: new Date(),
          status: YideWorkActivityStatus.PUBLISHED,
          locationId: 1,
          organiserId,
          ...overrides,
          assignments: overrides?.assignments
            ? overrides?.assignments
            : undefined,
        },
      });
      activities.push(activity);
      return activity;
    };

    await use(factory);

    // Cleanup: delete all created activities
    for (const activity of activities) {
      await db.yideWorkActivity
        .delete({ where: { id: activity.id } })
        .catch(() => {});
    }
  },
});
