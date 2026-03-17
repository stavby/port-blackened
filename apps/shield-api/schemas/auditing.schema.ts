import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

export const auditing = pgTable("auditing", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  operation: text("operation").notNull(),
  resource: text("resource").notNull(),
  status: text("status").notNull(),
  resourceInfo: jsonb("resource_info").notNull(),
  message: text("message").notNull(),
  difference: jsonb("difference").notNull(),
  time: text("time").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  operation: text("operation").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  difference: jsonb("difference").notNull(),
  time: timestamp("time").notNull(),
  version: integer("version").notNull(),
  metadata: jsonb("metadata"),
});
