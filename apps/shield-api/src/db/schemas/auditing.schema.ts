import { Difference } from "@port/shield-models";
import { relations } from "drizzle-orm";
import { foreignKey, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

const operationEnum = pgEnum("operation_enum", ["create", "update", "delete", "clone"]);

const resourceTypeEnum = pgEnum("resource_type_enum", [
  "application_user",
  "classification",
  "domain",
  "permission_table",
  "table",
  "task",
  "user",
  "permission_group",
]);

export const auditing = pgTable(
  "auditing",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull(),
    operation: operationEnum("operation").notNull(),
    resource: resourceTypeEnum("resource").notNull(),
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
    operation: operationEnum("operation").notNull(),
    resourceType: resourceTypeEnum("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    time: timestamp("time").notNull(),
    version: integer("version").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "aud_log_pk" })],
);

export const auditLogChanges = pgTable(
  "audit_log_changes",
  {
    id: uuid("id").defaultRandom().notNull(),
    auditLogId: uuid("audit_log_id").notNull(),
    difference: jsonb("difference").notNull().$type<Difference>(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "aud_log_chg_pk" }),
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
