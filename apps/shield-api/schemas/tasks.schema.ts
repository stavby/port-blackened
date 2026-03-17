import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tables } from "./table.schema";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  done: boolean("done").notNull(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id, { onDelete: "cascade" }),
  createDate: timestamp("create_date").notNull(),
  modifyDate: timestamp("modify_date").notNull(),
  aprrovalDate: timestamp("aprroval_date"),
  aprrovalId: text("aprroval_id"),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  table: one(tables, {
    fields: [tasks.tableId],
    references: [tables.id],
  }),
}));
