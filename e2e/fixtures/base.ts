import { test as base } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BaseFixtures = {
  db: PrismaClient;
};

export const test = base.extend<BaseFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern requires empty destructuring
  db: async ({}, use) => {
    await use(prisma);
  },
});
