import { relations } from "drizzle-orm";
import { foreignKey, pgTable, uuid, text, timestamp, boolean, primaryKey, unique } from "drizzle-orm/pg-core";
import { classifications, domainClassifications, domains } from "./organization.schema";
import { roles } from "./permissions.schema";

export const applicationUsers = pgTable("application_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isAdmin: boolean("is_admin").notNull(),
  canCreateConnections: boolean("can_create_connections").notNull(),
  canManageUniquePopulationIndications: boolean("can_manage_unique_population_indications").notNull(),
  givenBy: text("given_by"),
  lastChangedBy: text("last_changed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applicationUserDomains = pgTable("application_user_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationUserId: uuid("application_user_id")
    .notNull()
    .references(() => applicationUsers.id),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id),
},
  (table) => [
    unique("application_user_domain_id_domain_unique").on(table.id, table.domainId),
    unique("application_user_domain_unique").on(
      table.applicationUserId,
      table.domainId,
    ),
  ],
);

export const applicationUserDomainRoles = pgTable(
  "application_user_domain_roles",
  {
    applicationUserDomainId: uuid("application_user_domain_id")
      .notNull()
      .references(() => applicationUserDomains.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
  },
  (table) => [
    primaryKey({ columns: [table.applicationUserDomainId, table.roleId] }),
  ],
);

export const applicationUserDomainClassifications = pgTable(
  "application_user_domain_classifications",
  {
    applicationUserDomainId: uuid("application_user_domain_id")
      .notNull()
      .references(() => applicationUserDomains.id),
    domainId: uuid("domain_id").notNull(),
    classificationId: uuid("classification_id")
      .notNull()
      .references(() => classifications.id),
  },
  (table) => [
    primaryKey({ columns: [table.applicationUserDomainId, table.classificationId] }),
    foreignKey({
      columns: [table.applicationUserDomainId, table.domainId],
      foreignColumns: [applicationUserDomains.id, applicationUserDomains.domainId],
    }),
    foreignKey({
      columns: [table.domainId, table.classificationId],
      foreignColumns: [domainClassifications.domainId, domainClassifications.classificationId],
    }),
  ],
);

export const applicationUsersRelations = relations(applicationUsers, ({ many }) => ({
  domains: many(applicationUserDomains),
}));

export const applicationUserDomainsRelations = relations(applicationUserDomains, ({ one, many }) => ({
  applicationUser: one(applicationUsers, {
    fields: [applicationUserDomains.applicationUserId],
    references: [applicationUsers.id],
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

export const applicationUserDomainClassificationsRelations = relations(
  applicationUserDomainClassifications,
  ({ one }) => ({
    applicationUserDomain: one(applicationUserDomains, {
      fields: [applicationUserDomainClassifications.applicationUserDomainId],
      references: [applicationUserDomains.id],
    }),
    classification: one(classifications, {
      fields: [applicationUserDomainClassifications.classificationId],
      references: [classifications.id],
    }),
  }),
);
