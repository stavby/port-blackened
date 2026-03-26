import { pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";

export const sapTables = pgTable(
  "sap_tables",
  {
    id: uuid("id").defaultRandom().notNull(),
    schemaName: text("schema_name").notNull(),
    tableName: text("table_name").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "sap_tbl_pk" }), unique("sap_tbl_sch_tbl_uq").on(table.schemaName, table.tableName)],
);
