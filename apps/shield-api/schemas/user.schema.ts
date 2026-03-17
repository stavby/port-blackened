import { relations } from "drizzle-orm";
import { boolean, foreignKey, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications, domainClassifications, domains } from "./organization.schema";
import { permissionTables } from "./permissions.schema";

export const userTypes = pgTable("user_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull().unique(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  mask: boolean("mask").notNull(),
  deceasedPopulation: boolean("deceased_population").notNull(),
  userTypeId: uuid("user_type_id")
    .notNull()
    .references(() => userTypes.id),
  impersonateValue: boolean("impersonate_value").notNull(),
  impersonateExpression: text("impersonate_expression"),
  blocked: boolean("blocked"),
});

export const userCatalogs = pgTable("user_catalogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  catalogName: text("catalog_name").notNull(),
  write: boolean("write"),
  readAll: boolean("read_all"),
},
  (table) => [
    unique("user_catalog_unique").on(table.userId, table.catalogName),
  ],
);

export const userCatalogSchemas = pgTable("user_catalog_schemas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userCatalogId: uuid("user_catalog_id")
    .notNull()
    .references(() => userCatalogs.id),
  schemaName: text("schema_name").notNull(),
  write: boolean("write").notNull(),
},
  (table) => [
    unique("user_catalog_schema_unique").on(table.userCatalogId, table.schemaName),
  ],
);

export const userUniquePopulations = pgTable("user_unique_populations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  value: integer("value").notNull(),
});

export const userDomains = pgTable("user_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id),
  givenBy: text("given_by"),
  createdAt: timestamp("create_date"),
  lastChangedBy: text("last_changed_by"),
  updatedAt: timestamp("last_change"),
},
  (table) => [
    unique("user_domain_id_domain_unique").on(table.id, table.domainId),
    unique("user_domain_unique").on(table.userId, table.domainId),
  ],
);

export const userDomainClassifications = pgTable(
  "user_domain_classifications",
  {
    userDomainId: uuid("user_domain_id")
      .notNull()
      .references(() => userDomains.id),
    domainId: uuid("domain_id").notNull(),
    classificationId: uuid("classification_id")
      .notNull()
      .references(() => classifications.id),
  },
  (table) => [
    primaryKey({ columns: [table.userDomainId, table.classificationId] }),
    foreignKey({
      columns: [table.userDomainId, table.domainId],
      foreignColumns: [userDomains.id, userDomains.domainId],
    }),
    foreignKey({
      columns: [table.domainId, table.classificationId],
      foreignColumns: [domainClassifications.domainId, domainClassifications.classificationId],
    }),
  ],
);

export const userPermissionTables = pgTable("user_permission_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  permissionTableId: uuid("permission_table_id")
    .notNull()
    .references(() => permissionTables.id),
  givenBy: text("given_by"),
  lastChangedBy: text("last_changed_by"),
  updatedAt: timestamp("last_change"),
  createdAt: timestamp("create_date"),
},
  (table) => [
    unique("user_permission_table_unique").on(table.userId, table.permissionTableId),
  ],
);

export const userPermissionTableRowFilters = pgTable("user_permission_table_row_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userPermissionTableId: uuid("user_permission_table_id")
    .notNull()
    .references(() => userPermissionTables.id),
  kod: text("kod").notNull(),
},
  (table) => [
    unique("user_permission_table_row_filter_unique").on(table.userPermissionTableId, table.kod),
  ],
);

export const userPermissionTableRowFilterValues = pgTable("user_permission_table_row_filter_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  userPermissionTableRowFilterId: uuid("user_permission_table_row_filter_id")
    .notNull()
    .references(() => userPermissionTableRowFilters.id),
  value: jsonb("value").notNull(),
  displayName: text("display_name").notNull(),
});

export const userPermissionGroups = pgTable("user_permission_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id),
  givenBy: text("given_by").notNull(),
  registrationDate: timestamp("registration_date").notNull(),
},
  (table) => [
    unique("user_permission_group_unique").on(table.userId, table.domainId),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  userType: one(userTypes, {
    fields: [users.userTypeId],
    references: [userTypes.id],
  }),
  catalogs: many(userCatalogs),
  uniquePopulations: many(userUniquePopulations),
  domains: many(userDomains),
  permissionTables: many(userPermissionTables),
  permissionGroups: many(userPermissionGroups),
}));

export const userTypesRelations = relations(userTypes, ({ many }) => ({
  users: many(users),
}));

export const userCatalogsRelations = relations(userCatalogs, ({ one, many }) => ({
  user: one(users, {
    fields: [userCatalogs.userId],
    references: [users.id],
  }),
  schemas: many(userCatalogSchemas),
}));

export const userCatalogSchemasRelations = relations(userCatalogSchemas, ({ one }) => ({
  catalog: one(userCatalogs, {
    fields: [userCatalogSchemas.userCatalogId],
    references: [userCatalogs.id],
  }),
}));

export const userUniquePopulationsRelations = relations(userUniquePopulations, ({ one }) => ({
  user: one(users, {
    fields: [userUniquePopulations.userId],
    references: [users.id],
  }),
}));

export const userDomainsRelations = relations(userDomains, ({ one, many }) => ({
  user: one(users, {
    fields: [userDomains.userId],
    references: [users.id],
  }),
  domain: one(domains, {
    fields: [userDomains.domainId],
    references: [domains.id],
  }),
  classifications: many(userDomainClassifications),
}));

export const userDomainClassificationsRelations = relations(userDomainClassifications, ({ one }) => ({
  userDomain: one(userDomains, {
    fields: [userDomainClassifications.userDomainId],
    references: [userDomains.id],
  }),
  classification: one(classifications, {
    fields: [userDomainClassifications.classificationId],
    references: [classifications.id],
  }),
}));

export const userPermissionTablesRelations = relations(userPermissionTables, ({ one, many }) => ({
  user: one(users, {
    fields: [userPermissionTables.userId],
    references: [users.id],
  }),
  permissionTable: one(permissionTables, {
    fields: [userPermissionTables.permissionTableId],
    references: [permissionTables.id],
  }),
  rowFilters: many(userPermissionTableRowFilters),
}));

export const userPermissionTableRowFiltersRelations = relations(userPermissionTableRowFilters, ({ one, many }) => ({
  userPermissionTable: one(userPermissionTables, {
    fields: [userPermissionTableRowFilters.userPermissionTableId],
    references: [userPermissionTables.id],
  }),
  values: many(userPermissionTableRowFilterValues),
}));

export const userPermissionTableRowFilterValuesRelations = relations(userPermissionTableRowFilterValues, ({ one }) => ({
  rowFilter: one(userPermissionTableRowFilters, {
    fields: [userPermissionTableRowFilterValues.userPermissionTableRowFilterId],
    references: [userPermissionTableRowFilters.id],
  }),
}));

export const userPermissionGroupsRelations = relations(userPermissionGroups, ({ one }) => ({
  user: one(users, {
    fields: [userPermissionGroups.userId],
    references: [users.id],
  }),
  domain: one(domains, {
    fields: [userPermissionGroups.domainId],
    references: [domains.id],
  }),
}));
