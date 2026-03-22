import { pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";

export const sapPermittedUsers = pgTable(
  "sap_permitted_users",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull().unique(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "sap_usr_pk" })],
);

export const sapTables = pgTable(
  "sap_tables",
  {
    id: uuid("id").defaultRandom().notNull(),
    schemaName: text("schema_name").notNull(),
    tableName: text("table_name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "sap_tbl_pk" }),
    unique("sap_tbl_sch_tbl_uq").on(table.schemaName, table.tableName),
  ],
);
