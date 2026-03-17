import { relations } from "drizzle-orm";
import { boolean, foreignKey, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications, domainClassifications, domains } from "./organization.schema";
import { permissionTables } from "./permissions.schema";

export const columnMasks = pgTable("column_masks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogName: text("catalog_name").notNull(),
  schemaName: text("schema_name").notNull(),
  tableName: text("table_name").notNull(),
  tableDisplayName: text("table_display_name").notNull().default(""),
  tableDesc: text("table_desc").notNull().default(""),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id),
  permissionKeys: jsonb("permission_keys").notNull(),
  permissionTableId: uuid("permission_table_id").references(() => permissionTables.id),
  owner: text("owner").notNull(),
  sourceType: text("source_type").notNull(),
  connection: jsonb("connection"),
  application: text("application"),
  query: text("query"),
  scheduleType: text("schedule_type"),
  processType: text("process_type"),
  schedule: text("schedule"),
  updatingDependencies: jsonb("updating_dependencies"),
  lastVerificationTime: timestamp("last_verification_time"),
  isDeprecated: boolean("is_deprecated").notNull().default(false),
},
    (table) => [
    unique("table_id_domain_unique").on(table.id, table.domainId),
      unique("table_catalog_schema_name_unique").on(table.catalogName, table.schemaName, table.tableName),
    ],
);

export const tableColumns = pgTable("table_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id),
  domainId: uuid("domain_id").notNull(),
  columnName: text("column_name").notNull(),
  dataType: text("data_type").notNull(),
  columnDisplayName: text("column_display_name").notNull().default(""),
  columnDesc: text("column_desc").notNull().default(""),
  isKey: boolean("is_key").notNull().default(false),
  classificationId: uuid("classification_id"),
  maskId: uuid("mask_id").references(() => columnMasks.id),
},
    (table) => [
      unique("table_column_unique").on(table.tableId, table.columnName),
    foreignKey({
      columns: [table.tableId, table.domainId],
      foreignColumns: [tables.id, tables.domainId],
    }),
    foreignKey({
      columns: [table.domainId, table.classificationId],
      foreignColumns: [domainClassifications.domainId, domainClassifications.classificationId],
    }),
    ],
);

export const tableCoOwners = pgTable("table_co_owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
},
    (table) => [
      unique("table_co_owner_unique").on(table.tableId, table.ownerId),
    ],
);

export const tableVerificationStages = pgTable("table_verification_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id),
  stage: text("stage").notNull(),
  isChecked: boolean("is_checked").notNull(),
},
    (table) => [
      unique("table_verification_stage_unique").on(table.tableId, table.stage),
    ],
);

export const columnMasksRelations = relations(columnMasks, ({ many }) => ({
  tableColumns: many(tableColumns),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  domain: one(domains, {
    fields: [tables.domainId],
    references: [domains.id],
  }),
  permissionTable: one(permissionTables, {
    fields: [tables.permissionTableId],
    references: [permissionTables.id],
  }),
  columns: many(tableColumns),
  coOwners: many(tableCoOwners),
  verificationStages: many(tableVerificationStages),
}));

export const tableColumnsRelations = relations(tableColumns, ({ one }) => ({
  table: one(tables, {
    fields: [tableColumns.tableId],
    references: [tables.id],
  }),
  classification: one(classifications, {
    fields: [tableColumns.classificationId],
    references: [classifications.id],
  }),
  mask: one(columnMasks, {
    fields: [tableColumns.maskId],
    references: [columnMasks.id],
  }),
}));

export const tableCoOwnersRelations = relations(tableCoOwners, ({ one }) => ({
  table: one(tables, {
    fields: [tableCoOwners.tableId],
    references: [tables.id],
  }),
}));

export const tableVerificationStagesRelations = relations(tableVerificationStages, ({ one }) => ({
  table: one(tables, {
    fields: [tableVerificationStages.tableId],
    references: [tables.id],
  }),
}));
