import { PrismaClient } from "@prisma/client";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env.mjs";
import * as schema from "./schema";

/**
 * Drizzle
 */

const globalForDrizzle = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDrizzle.conn ?? postgres(env.DATABASE_PRISMA_URL);
if (env.NODE_ENV !== "production") globalForDrizzle.conn = conn;

export const drizzleDB = drizzle(conn, { schema });

/**
 * Prisma
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
