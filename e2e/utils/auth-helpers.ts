import type { BrowserContext } from "@playwright/test";
import { PrismaClient, type Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function loginAs(context: BrowserContext, roles: Role[]) {
  const timestamp = Date.now();
  const email = `test-user-${timestamp}-${Math.floor(Math.random() * 1000)}@example.com`;
  const userId = `user-${timestamp}-${Math.floor(Math.random() * 1000)}`;
  const sessionToken = `session-${timestamp}-${Math.floor(Math.random() * 1000)}`;

  // Create user
  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      name: `Test User ${timestamp}`,
      roles: roles,
    },
  });

  // Create session
  const expires = new Date();
  expires.setDate(expires.getDate() + 1);
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  // Set cookies
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

  return user;
}
