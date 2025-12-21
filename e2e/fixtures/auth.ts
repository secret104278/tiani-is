import { Role, type User } from "@prisma/client";
import { switchUser as switchUserUtil } from "../utils/auth-helpers";
import { test as base } from "./base";

type AuthFixtures = {
  createUser: (roles?: Role[]) => Promise<User>;
  testUser: User;
  testAdmin: User;
  loginAsUser: User;
  loginAsAdmin: User;
  switchUser: (
    userId: string,
  ) => Promise<{ sessionToken: string; expires: Date }>;
};

export const test = base.extend<AuthFixtures>({
  createUser: async ({ db }, use) => {
    const users: User[] = [];

    const factory = async (roles: Role[] = []) => {
      const id = `user-${crypto.randomUUID()}`;
      const email = `test-${crypto.randomUUID()}@example.com`;

      const user = await db.user.create({
        data: {
          id,
          email,
          name: `Test User ${Date.now()}`,
          roles,
        },
      });

      users.push(user);
      return user;
    };

    await use(factory);

    // Cleanup: delete all created users
    for (const user of users) {
      await db.user.delete({ where: { id: user.id } }).catch(() => {});
    }
  },

  testUser: async ({ createUser }, use) => {
    const user = await createUser([]);
    await use(user);
  },

  testAdmin: async ({ createUser }, use) => {
    const user = await createUser([Role.TIANI_ADMIN]);
    await use(user);
  },

  loginAsUser: async ({ page, context, db, testUser }, use) => {
    // Create session in DB
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sessionToken = `session-${timestamp}-${random}`;

    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    await db.session.create({
      data: {
        sessionToken,
        userId: testUser.id,
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

    await use(testUser);

    // Cleanup: delete the session
    await db.session.delete({ where: { sessionToken } }).catch(() => {});
  },

  loginAsAdmin: async ({ page, context, db, testAdmin }, use) => {
    // Create session in DB
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sessionToken = `session-${timestamp}-${random}`;

    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    await db.session.create({
      data: {
        sessionToken,
        userId: testAdmin.id,
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

    await use(testAdmin);

    // Cleanup: delete the session
    await db.session.delete({ where: { sessionToken } }).catch(() => {});
  },

  switchUser: async ({ context }, use) => {
    const sessions: string[] = [];
    const prisma = new (await import("@prisma/client")).PrismaClient();

    const switcher = async (userId: string) => {
      const result = await switchUserUtil(context, userId);
      sessions.push(result.sessionToken);
      return result;
    };

    await use(switcher);

    // Cleanup: delete all sessions created via switchUser
    for (const token of sessions) {
      await prisma.session
        .delete({ where: { sessionToken: token } })
        .catch(() => {});
    }
  },
});
