import { relations } from "drizzle-orm";
import { boolean, foreignKey, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tables } from "./table.schema";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().notNull(),
    type: text("type").notNull(),
    done: boolean("done").notNull(),
    tableId: uuid("table_id").notNull(),
    createDate: timestamp("create_date").notNull(),
    modifyDate: timestamp("modify_date").notNull(),
    aprrovalDate: timestamp("aprroval_date"),
    aprrovalId: text("aprroval_id"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "task_pk" }),
    foreignKey({
      columns: [table.tableId],
      foreignColumns: [tables.id],
      name: "task_tbl_fk",
    }).onDelete("cascade"),
  ],
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  table: one(tables, {
    fields: [tasks.tableId],
    references: [tables.id],
  }),
}));
