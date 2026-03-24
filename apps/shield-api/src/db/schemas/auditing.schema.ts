import { relations } from "drizzle-orm";
import { foreignKey, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const auditing = pgTable(
  "auditing",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull(),
    operation: text("operation").notNull(),
    resource: text("resource").notNull(),
    status: text("status").notNull(),
    resourceInfo: jsonb("resource_info").notNull(),
    message: text("message").notNull(),
    difference: jsonb("difference").notNull(),
    time: text("time").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "aud_pk" })],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull(),
    operation: text("operation").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    difference: jsonb("difference").notNull(),
    time: timestamp("time").notNull(),
    version: integer("version").notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => [primaryKey({ columns: [table.id], name: "aud_log_pk" })],
);

export const auditLogChanges = pgTable(
  "audit_log_changes",
  {
    id: uuid("id").defaultRandom().notNull(),
    auditLogId: uuid("audit_log_id").notNull(),
    changeIndex: integer("change_index").notNull(),
    kind: text("kind").notNull(),
    changeType: text("change_type"),
    fieldPath: text("field_path"),
    columnName: text("column_name"),
    rowFilterKod: text("row_filter_kod"),
    stage: text("stage"),
    actionType: text("action_type"),
    domainId: text("domain_id"),
    classificationId: text("classification_id"),
    permissionTableId: text("permission_table_id"),
    permissionGroupId: text("permission_group_id"),
    roleId: text("role_id"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    value: jsonb("value"),
    rawDiff: jsonb("raw_diff").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "aud_log_chg_pk" }),
    unique("aud_log_chg_seq_uq").on(table.auditLogId, table.changeIndex),
    foreignKey({
      columns: [table.auditLogId],
      foreignColumns: [auditLogs.id],
      name: "aud_log_chg_log_fk",
    }).onDelete("cascade"),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ many }) => ({
  changes: many(auditLogChanges),
}));

export const auditLogChangesRelations = relations(auditLogChanges, ({ one }) => ({
  auditLog: one(auditLogs, {
    fields: [auditLogChanges.auditLogId],
    references: [auditLogs.id],
  }),
}));
