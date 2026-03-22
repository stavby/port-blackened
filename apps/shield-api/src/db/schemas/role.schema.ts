import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().notNull(),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    color: text("color").notNull(),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "role_pk" })],
);

export const rolesRelations = relations(roles, () => ({}));
