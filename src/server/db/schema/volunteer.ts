import { sql } from "drizzle-orm";
import {
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userPgTable } from "./user";

export const volunteerActivityStatus = pgEnum("VolunteerActivityStatus", [
  "DRAFT",
  "INREVIEW",
  "PUBLISHED",
]);

export const volunteerActivityPgTable = pgTable(
  "VolunteerActivity",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    headcount: integer().notNull(),
    location: text().notNull(),
    startDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    endDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    status: volunteerActivityStatus().default("INREVIEW").notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    organiserId: text().notNull(),
    version: integer().default(1).notNull(),
  },
  (table) => [
    index("VolunteerActivity_organiserId_idx").using(
      "btree",
      table.organiserId.asc().nullsLast().op("text_ops"),
    ),
    index("VolunteerActivity_startDateTime_idx").using(
      "btree",
      table.startDateTime.asc().nullsLast().op("timestamp_ops"),
    ),
    foreignKey({
      columns: [table.organiserId],
      foreignColumns: [userPgTable.id],
      name: "VolunteerActivity_organiserId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const volunteerActivityCheckRecordPgTable = pgTable(
  "VolunteerActivityCheckRecord",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
    activityId: integer().notNull(),
    checkInAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    checkInLatitude: doublePrecision(),
    checkInLongitude: doublePrecision(),
    checkOutAt: timestamp({ precision: 3, mode: "string" }),
    checkOutLatitude: doublePrecision(),
    checkOutLongitude: doublePrecision(),
  },
  (table) => [
    index("VolunteerActivityCheckRecord_activityId_idx").using(
      "btree",
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    uniqueIndex("VolunteerActivityCheckRecord_userId_activityId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    index("VolunteerActivityCheckRecord_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [volunteerActivityPgTable.id],
      name: "VolunteerActivityCheckRecord_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "VolunteerActivityCheckRecord_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const participatedVolunteerActivitesPgTable = pgTable(
  "_ParticipatedVolunteerActivites",
  {
    a: text("A").notNull(),
    b: integer("B").notNull(),
  },
  (table) => [
    index().using("btree", table.b.asc().nullsLast().op("int4_ops")),
    foreignKey({
      columns: [table.a],
      foreignColumns: [userPgTable.id],
      name: "_ParticipatedVolunteerActivites_A_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.b],
      foreignColumns: [volunteerActivityPgTable.id],
      name: "_ParticipatedVolunteerActivites_B_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    primaryKey({
      columns: [table.a, table.b],
      name: "_ParticipatedVolunteerActivites_AB_pkey",
    }),
  ],
);

export const casualCheckRecordPgTable = pgTable(
  "CasualCheckRecord",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
    checkInAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    checkOutAt: timestamp({ precision: 3, mode: "string" }),
    checkInLatitude: doublePrecision(),
    checkInLongitude: doublePrecision(),
    checkOutLatitude: doublePrecision(),
    checkOutLongitude: doublePrecision(),
  },
  (table) => [
    index("CasualCheckRecord_userId_checkInAt_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.checkInAt.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "CasualCheckRecord_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);
