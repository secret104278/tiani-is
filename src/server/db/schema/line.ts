import {
  foreignKey,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userPgTable } from "./user";

export const lineNotifyPgTable = pgTable(
  "LineNotify",
  {
    id: serial().primaryKey().notNull(),
    userId: text().notNull(),
    accessToken: text().notNull(),
  },
  (table) => [
    uniqueIndex("LineNotify_userId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userPgTable.id],
      name: "LineNotify_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
