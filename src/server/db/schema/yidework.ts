import { sql } from "drizzle-orm";
import {
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

export const yideWorkActivityStatus = pgEnum("YideWorkActivityStatus", [
  "DRAFT",
  "PUBLISHED",
]);

export const yideWorkActivityPgTable = pgTable(
  "YideWorkActivity",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    locationId: integer().notNull(),
    status: yideWorkActivityStatus().default("PUBLISHED").notNull(),
    startDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    endDateTime: timestamp({ precision: 3, mode: "string" }).notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    organiserId: text().notNull(),
    version: integer().default(1).notNull(),
    presetId: integer(),
  },
  (table) => [
    index("YideWorkActivity_locationId_idx").using(
      "btree",
      table.locationId.asc().nullsLast().op("int4_ops"),
    ),
    index("YideWorkActivity_organiserId_idx").using(
      "btree",
      table.organiserId.asc().nullsLast().op("text_ops"),
    ),
    index("YideWorkActivity_startDateTime_idx").using(
      "btree",
      table.startDateTime.asc().nullsLast().op("timestamp_ops"),
    ),
    index("YideWorkActivity_title_idx").using(
      "btree",
      table.title.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [yideWorkLocationPgTable.id],
      name: "YideWorkActivity_locationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.organiserId],
      foreignColumns: [userPgTable.id],
      name: "YideWorkActivity_organiserId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.presetId],
      foreignColumns: [yideWorkPresetPgTable.id],
      name: "YideWorkActivity_presetId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const yideWorkActivityRegisterPgTable = pgTable(
  "YideWorkActivityRegister",
  {
    id: serial().primaryKey().notNull(),
    activityId: integer().notNull(),
    userId: text().notNull(),
  },
  (table) => [
    uniqueIndex("YideWorkActivityRegister_userId_activityId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("int4_ops"),
      table.activityId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [yideWorkActivityPgTable.id],
      name: "YideWorkActivityRegister_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "YideWorkActivityRegister_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const yideWorkLocationPgTable = pgTable("YideWorkLocation", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const externalYideWorkActivityRegisterPgTable = pgTable(
  "ExternalYideWorkActivityRegister",
  {
    id: serial().primaryKey().notNull(),
    activityId: integer().notNull(),
    username: text().notNull(),
    mainRegisterId: integer().notNull(),
  },
  (table) => [
    uniqueIndex(
      "ExternalYideWorkActivityRegister_activityId_username_key",
    ).using(
      "btree",
      table.activityId.asc().nullsLast().op("int4_ops"),
      table.username.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [yideWorkActivityPgTable.id],
      name: "ExternalYideWorkActivityRegister_activityId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.mainRegisterId],
      foreignColumns: [yideWorkActivityRegisterPgTable.id],
      name: "ExternalYideWorkActivityRegister_mainRegisterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const yideWorkPresetPgTable = pgTable("YideWorkPreset", {
  id: serial().primaryKey().notNull(),
  description: text().notNull(),
});
