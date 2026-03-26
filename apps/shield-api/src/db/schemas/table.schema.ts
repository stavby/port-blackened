import { relations } from "drizzle-orm";
import { boolean, foreignKey, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { domains } from "./domain.schema";
import { permissionTables } from "./permission_table.schema";

export const verificationStageNameEnum = pgEnum("verification_stage_name", [
  "technical_correctness",
  "business_correctness",
  "documentation_correctness",
]);

export const columnMasks = pgTable(
  "column_masks",
  {
    id: uuid("id").defaultRandom().notNull(),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "col_msk_pk" })],
);

export const tables = pgTable(
  "tables",
  {
    id: uuid("id").defaultRandom().notNull(),
    catalogName: text("catalog_name").notNull(),
    schemaName: text("schema_name").notNull(),
    tableName: text("table_name").notNull(),
    tableDisplayName: text("table_display_name").notNull().default(""),
    tableDesc: text("table_desc").notNull().default(""),
    domainId: text("domain_id").notNull(),
    permissionTableId: text("permission_table_id"),
    ownerId: text("owner_id").notNull(),
    sourceType: text("source_type"),
    connectionDisplayName: text("connection_display_name"),
    isTest: boolean("is_test").notNull().default(false),
    application: text("application"),
    query: text("query"),
    scheduleType: text("schedule_type"),
    processType: text("process_type"),
    schedule: text("schedule"),
    lastVerificationTime: timestamp("last_verification_time"),
    isDeprecated: boolean("is_deprecated").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "tbl_pk" }),
    unique("tbl_cat_sch_nm_uq").on(table.catalogName, table.schemaName, table.tableName),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domains.id],
      name: "tbl_dom_fk",
    }),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "tbl_pt_fk",
    }),
  ],
);

export const tableColumns = pgTable(
  "table_columns",
  {
    id: uuid("id").defaultRandom().notNull(),
    tableId: uuid("table_id").notNull(),
    columnName: text("column_name").notNull(),
    dataType: text("data_type").notNull(),
    columnDisplayName: text("column_display_name").notNull().default(""),
    columnDesc: text("column_desc").notNull().default(""),
    isKey: boolean("is_key").notNull().default(false),
    authKey: text("auth_key"),
    classificationId: text("classification_id"),
    maskId: uuid("mask_id"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "tbl_col_pk" }),
    unique("tbl_col_uq").on(table.tableId, table.columnName),
    foreignKey({
      columns: [table.tableId],
      foreignColumns: [tables.id],
      name: "tbl_col_tbl_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.classificationId],
      foreignColumns: [classifications.id],
      name: "tbl_col_cls_fk",
    }),
    foreignKey({
      columns: [table.maskId],
      foreignColumns: [columnMasks.id],
      name: "tbl_col_msk_fk",
    }),
  ],
);

export const tableCoOwners = pgTable(
  "table_co_owners",
  {
    id: uuid("id").defaultRandom().notNull(),
    tableId: uuid("table_id").notNull(),
    ownerId: text("owner_id").notNull(),
    ownerName: text("owner_name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "tbl_co_own_pk" }),
    unique("tbl_co_own_uq").on(table.tableId, table.ownerId),
    foreignKey({
      columns: [table.tableId],
      foreignColumns: [tables.id],
      name: "tbl_co_own_tbl_fk",
    }).onDelete("cascade"),
  ],
);

export const tableVerificationStages = pgTable(
  "table_verification_stages",
  {
    id: uuid("id").defaultRandom().notNull(),
    tableId: uuid("table_id").notNull(),
    stage: verificationStageNameEnum("stage").notNull(),
    isChecked: boolean("is_checked").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "tbl_vrf_stg_pk" }),
    unique("tbl_vrf_stg_uq").on(table.tableId, table.stage),
    foreignKey({
      columns: [table.tableId],
      foreignColumns: [tables.id],
      name: "tbl_vrf_stg_tbl_fk",
    }).onDelete("cascade"),
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
