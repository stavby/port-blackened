import { relations, sql } from "drizzle-orm";
import { foreignKey, pgEnum, pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";
import { objectId } from "./shared.schema";

export const permissionTableRowFilterTypeEnum = pgEnum("permission_table_row_filter_type", ["integer", "string", "boolean"]);
export const permissionTableRowFilterQueryBuilderTypeEnum = pgEnum("permission_table_row_filter_query_builder_type", [
  "select",
  "tree",
  "boolean",
]);

export const permissionTables = pgTable(
  "permission_tables",
  {
    id: objectId("id"),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "perm_tbl_pk" }), unique("perm_tbl_name_uq").on(table.name)],
);

export const permissionTableRowFilters = pgTable(
  "permission_table_row_filters",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionTableId: text("permission_table_id").notNull(),
    kod: text("kod").notNull(),
    displayName: text("display_name").notNull(),
    dimensionsTable: text("dimensions_table").notNull(),
    dataType: permissionTableRowFilterTypeEnum("data_type").notNull(),
    uiControlType: permissionTableRowFilterQueryBuilderTypeEnum("ui_control_type").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_tbl_rf_pk" }),
    unique("perm_tbl_rf_id_tbl_uq").on(table.id, table.permissionTableId),
    unique("perm_tbl_rf_uq").on(table.permissionTableId, table.kod),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "perm_tbl_rf_tbl_fk",
    }),
  ],
);

export const permissionTableKeys = pgTable(
  "permission_table_keys",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionTableId: text("permission_table_id").notNull(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    trinoType: text("trino_type").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_tbl_key_pk" }),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "perm_tbl_key_tbl_fk",
    }),
  ],
);

export const permissionTablesRelations = relations(permissionTables, ({ many }) => ({
  rowFilters: many(permissionTableRowFilters),
  permissionKeys: many(permissionTableKeys),
}));

export const permissionTableRowFiltersRelations = relations(permissionTableRowFilters, ({ one }) => ({
  permissionTable: one(permissionTables, {
    fields: [permissionTableRowFilters.permissionTableId],
    references: [permissionTables.id],
  }),
}));

export const permissionTableKeysRelations = relations(permissionTableKeys, ({ one }) => ({
  permissionTable: one(permissionTables, {
    fields: [permissionTableKeys.permissionTableId],
    references: [permissionTables.id],
  }),
}));
