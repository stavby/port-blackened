import { relations } from "drizzle-orm";
import { foreignKey, pgTable, uuid, text, boolean, primaryKey, unique } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { domains } from "./domain.schema";
import { roles } from "./role.schema";
import { createMetaAuditColumns } from "./shared.schema";

export const applicationUsers = pgTable(
  "application_users",
  {
    userId: text("user_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    isAdmin: boolean("is_admin").notNull(),
    canCreateConnections: boolean("can_create_connections").notNull(),
    canManageUniquePopulationIndications: boolean("can_manage_unique_population_indications").notNull(),
    ...createMetaAuditColumns(),
  },
  (table) => [primaryKey({ columns: [table.userId], name: "app_usr_pk" })],
);

export const applicationUserDomains = pgTable(
  "application_user_domains",
  {
    id: uuid("id").defaultRandom().notNull(),
    applicationUserId: text("application_user_id").notNull(),
    domainId: text("domain_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "app_usr_dom_pk" }),
    unique("app_usr_dom_uq").on(table.applicationUserId, table.domainId),
    foreignKey({
      columns: [table.applicationUserId],
      foreignColumns: [applicationUsers.userId],
      name: "app_usr_dom_usr_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domains.id],
      name: "app_usr_dom_dom_fk",
    }),
  ],
);

export const applicationUserDomainRoles = pgTable(
  "application_user_domain_roles",
  {
    applicationUserDomainId: uuid("application_user_domain_id").notNull(),
    roleId: uuid("role_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.applicationUserDomainId, table.roleId], name: "app_usr_dom_role_pk" }),
    foreignKey({
      columns: [table.applicationUserDomainId],
      foreignColumns: [applicationUserDomains.id],
      name: "app_usr_dom_role_dom_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
      name: "app_usr_dom_role_role_fk",
    }),
  ],
);

export const applicationUserDomainClassifications = pgTable(
  "application_user_domain_classifications",
  {
    applicationUserDomainId: uuid("application_user_domain_id").notNull(),
    classificationId: text("classification_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.applicationUserDomainId, table.classificationId], name: "app_usr_dom_cls_pk" }),
    foreignKey({
      columns: [table.classificationId],
      foreignColumns: [classifications.id],
      name: "app_usr_dom_cls_cls_fk",
    }),
    foreignKey({
      columns: [table.applicationUserDomainId],
      foreignColumns: [applicationUserDomains.id],
      name: "app_usr_dom_cls_fk_ud",
    }).onDelete("cascade"),
  ],
);

export const applicationUsersRelations = relations(applicationUsers, ({ many }) => ({
  domains: many(applicationUserDomains),
}));

export const applicationUserDomainsRelations = relations(applicationUserDomains, ({ one, many }) => ({
  applicationUser: one(applicationUsers, {
    fields: [applicationUserDomains.applicationUserId],
    references: [applicationUsers.userId],
  }),
  domain: one(domains, {
    fields: [applicationUserDomains.domainId],
    references: [domains.id],
  }),
  roles: many(applicationUserDomainRoles),
  classifications: many(applicationUserDomainClassifications),
}));

export const applicationUserDomainRolesRelations = relations(applicationUserDomainRoles, ({ one }) => ({
  applicationUserDomain: one(applicationUserDomains, {
    fields: [applicationUserDomainRoles.applicationUserDomainId],
    references: [applicationUserDomains.id],
  }),
  role: one(roles, {
    fields: [applicationUserDomainRoles.roleId],
    references: [roles.id],
  }),
}));

export const applicationUserDomainClassificationsRelations = relations(applicationUserDomainClassifications, ({ one }) => ({
  applicationUserDomain: one(applicationUserDomains, {
    fields: [applicationUserDomainClassifications.applicationUserDomainId],
    references: [applicationUserDomains.id],
  }),
  classification: one(classifications, {
    fields: [applicationUserDomainClassifications.classificationId],
    references: [classifications.id],
  }),
}));
