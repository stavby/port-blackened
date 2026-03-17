import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

export const sapPermittedUsers = pgTable("sap_permitted_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
});

export const sapTables = pgTable("sap_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  schemaName: text("schema_name").notNull(),
  tableName: text("table_name").notNull(),
},
  (table) => [
    unique("sap_tables_schema_table_unique").on(table.schemaName, table.tableName),
  ],
);
