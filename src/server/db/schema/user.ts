import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const role = pgEnum("role", [
  "TIANI_ADMIN",
  "VOLUNTEER_ADMIN",
  "YIDECLASS_ADMIN",
  "ETOGETHER_ADMIN",
  "YIDEWORK_ADMIN",
]);

export const accountPgTable = pgTable(
  "Account",
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    uniqueIndex("Account_provider_providerAccountId_key").using(
      "btree",
      table.provider.asc().nullsLast().op("text_ops"),
      table.providerAccountId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "Account_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const sessionPgTable = pgTable(
  "Session",
  {
    id: text().primaryKey().notNull(),
    sessionToken: text().notNull(),
    userId: text().notNull(),
    expires: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("Session_sessionToken_key").using(
      "btree",
      table.sessionToken.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "Session_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const userPgTable = pgTable(
  "User",
  {
    id: text().primaryKey().notNull(),
    name: text(),
    email: text(),
    emailVerified: timestamp({ precision: 3, mode: "string" }),
    image: text(),
    roles: role()
      .array()
      .default(sql`ARRAY[]::"role"[]`),
  },
  (table) => [
    uniqueIndex("User_email_key").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const activityReviewerPgTable = pgTable(
  "ActivityReviewer",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
  },
  (table) => [
    uniqueIndex("ActivityReviewer_userId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "ActivityReviewer_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);
