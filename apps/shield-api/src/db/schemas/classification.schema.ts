import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

export const classifications = pgTable(
  "classifications",
  {
    id: uuid("id").defaultRandom().notNull(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "cls_pk" })],
);
