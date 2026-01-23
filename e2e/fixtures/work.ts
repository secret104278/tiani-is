import {
  type Prisma,
  Role,
  type User,
  type YideWorkActivity,
} from "@prisma/client";
import { test as base } from "./auth";

type WorkFixtures = {
  testWorkAdmin: User;
  loginAsWorkAdmin: User;
  createWorkActivity: (
    organiserId: string,
    overrides?: Partial<YideWorkActivity>,
  ) => Promise<YideWorkActivity>;
};

export const test = base.extend<WorkFixtures>({
  testWorkAdmin: async ({ createUser }, use) => {
    const user = await createUser([Role.YIDEWORK_ADMIN]);
    await use(user);
  },

  loginAsWorkAdmin: async ({ context, db, testWorkAdmin }, use) => {
    await db.yideWorkLocation
      .upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: "天一聖道院" },
      })
      .catch(() => {});

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sessionToken = `session-${timestamp}-${random}`;

    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    await db.session.create({
      data: {
        sessionToken,
        userId: testWorkAdmin.id,
        expires,
      },
    });

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

    await use(testWorkAdmin);

    await db.session.delete({ where: { sessionToken } }).catch(() => {});
  },

  createWorkActivity: async ({ db }, use) => {
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
          status: "PUBLISHED",
          locationId: 1,
          organiserId,
          ...overrides,
          assignments:
            (overrides?.assignments as Prisma.InputJsonValue) ?? undefined,
          rolesConfig:
            (overrides?.rolesConfig as Prisma.InputJsonValue) ?? undefined,
        },
      });
      activities.push(activity);
      return activity;
    };

    await use(factory);

    for (const activity of activities) {
      await db.yideWorkActivity
        .delete({ where: { id: activity.id } })
        .catch(() => {});
    }
  },
});
