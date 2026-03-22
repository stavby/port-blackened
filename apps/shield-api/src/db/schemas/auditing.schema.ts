import { pgTable, text, timestamp, uuid, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";

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
