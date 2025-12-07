import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "~/prisma-client";

import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  // https://github.com/prisma/prisma/issues/27611#issuecomment-3067177513
  connectionString: `${env.DATABASE_PRISMA_URL}?sslmode=prefer&uselibpqcompat=true`,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
