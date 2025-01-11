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

export const etogetherActivityStatus = pgEnum("EtogetherActivityStatus", [
  "DRAFT",
  "PUBLISHED",
]);

export const etogetherActivityRegisterPgTable = pgTable(
  "EtogetherActivityRegister",
  {
    id: serial().primaryKey().notNull(),
    activityId: integer().notNull(),
    userId: text().notNull(),
    subgroupId: integer().notNull(),
  },
  (table) => [
    uniqueIndex("EtogetherActivityRegister_userId_activityId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [etogetherActivityPgTable.id],
      name: "EtogetherActivityRegister_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.subgroupId],
      foreignColumns: [etogetherActivitySubgroupPgTable.id],
      name: "EtogetherActivityRegister_subgroupId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "EtogetherActivityRegister_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const etogetherActivityCheckRecordPgTable = pgTable(
  "EtogetherActivityCheckRecord",
  {
    id: serial().primaryKey().notNull(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    registerId: integer().notNull(),
  },
  (table) => [
    uniqueIndex("EtogetherActivityCheckRecord_registerId_key").using(
      "btree",
      table.registerId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.registerId],
      foreignColumns: [etogetherActivityRegisterPgTable.id],
      name: "EtogetherActivityCheckRecord_registerId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const etogetherActivitySubgroupPgTable = pgTable(
  "EtogetherActivitySubgroup",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    etogetherActivityId: integer().notNull(),
    displayColorCode: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.etogetherActivityId],
      foreignColumns: [etogetherActivityPgTable.id],
      name: "EtogetherActivitySubgroup_etogetherActivityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const etogetherActivityPgTable = pgTable(
  "EtogetherActivity",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    location: text().notNull(),
    startDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    endDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    status: etogetherActivityStatus().default("PUBLISHED").notNull(),
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
    index("EtogetherActivity_organiserId_idx").using(
      "btree",
      table.organiserId.asc().nullsLast().op("text_ops"),
    ),
    index("EtogetherActivity_startDateTime_idx").using(
      "btree",
      table.startDateTime.asc().nullsLast().op("timestamp_ops"),
    ),
    index("EtogetherActivity_title_idx").using(
      "btree",
      table.title.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organiserId],
      foreignColumns: [userPgTable.id],
      name: "EtogetherActivity_organiserId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const externalEtogetherActivityRegisterPgTable = pgTable(
  "ExternalEtogetherActivityRegister",
  {
    id: serial().primaryKey().notNull(),
    activityId: integer().notNull(),
    username: text().notNull(),
    mainRegisterId: integer().notNull(),
    subgroupId: integer().notNull(),
  },
  (table) => [
    uniqueIndex(
      "ExternalEtogetherActivityRegister_activityId_username_key",
    ).using(
      "btree",
      table.activityId.asc().nullsLast().op("int4_ops"),
      table.username.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [etogetherActivityPgTable.id],
      name: "ExternalEtogetherActivityRegister_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.mainRegisterId],
      foreignColumns: [etogetherActivityRegisterPgTable.id],
      name: "ExternalEtogetherActivityRegister_mainRegisterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.subgroupId],
      foreignColumns: [etogetherActivitySubgroupPgTable.id],
      name: "ExternalEtogetherActivityRegister_subgroupId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const externalEtogetherActivityCheckRecordPgTable = pgTable(
  "ExternalEtogetherActivityCheckRecord",
  {
    id: serial().primaryKey().notNull(),
    registerId: integer().notNull(),
  },
  (table) => [
    uniqueIndex("ExternalEtogetherActivityCheckRecord_registerId_key").using(
      "btree",
      table.registerId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.registerId],
      foreignColumns: [externalEtogetherActivityRegisterPgTable.id],
      name: "ExternalEtogetherActivityCheckRecord_registerId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
