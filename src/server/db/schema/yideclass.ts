import { sql } from "drizzle-orm";
import {
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userPgTable } from "./user";

export const classActivityStatus = pgEnum("ClassActivityStatus", [
  "DRAFT",
  "PUBLISHED",
]);

export const classActivityPgTable = pgTable(
  "ClassActivity",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    location: text().notNull(),
    startDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    endDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    status: classActivityStatus().default("PUBLISHED").notNull(),
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
    index("ClassActivity_organiserId_idx").using(
      "btree",
      table.organiserId.asc().nullsLast().op("text_ops"),
    ),
    index("ClassActivity_startDateTime_idx").using(
      "btree",
      table.startDateTime.asc().nullsLast().op("timestamp_ops"),
    ),
    index("ClassActivity_title_idx").using(
      "btree",
      table.title.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organiserId],
      foreignColumns: [userPgTable.id],
      name: "ClassActivity_organiserId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const classActivityLeaveRecordPgTable = pgTable(
  "ClassActivityLeaveRecord",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
    activityId: integer().notNull(),
  },
  (table) => [
    index("ClassActivityLeaveRecord_activityId_idx").using(
      "btree",
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    uniqueIndex("ClassActivityLeaveRecord_userId_activityId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    index("ClassActivityLeaveRecord_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [classActivityPgTable.id],
      name: "ClassActivityLeaveRecord_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "ClassActivityLeaveRecord_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const classMemberEnrollmentPgTable = pgTable(
  "ClassMemberEnrollment",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
    classTitle: text().notNull(),
  },
  (table) => [
    index("ClassMemberEnrollment_classTitle_idx").using(
      "btree",
      table.classTitle.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("ClassMemberEnrollment_userId_classTitle_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.classTitle.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "ClassMemberEnrollment_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const classActivityCheckRecordPgTable = pgTable(
  "ClassActivityCheckRecord",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
    activityId: integer().notNull(),
    checkAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
  },
  (table) => [
    index("ClassActivityCheckRecord_activityId_idx").using(
      "btree",
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    uniqueIndex("ClassActivityCheckRecord_userId_activityId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    index("ClassActivityCheckRecord_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [classActivityPgTable.id],
      name: "ClassActivityCheckRecord_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "ClassActivityCheckRecord_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);
