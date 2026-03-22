import { relations } from "drizzle-orm";
import { boolean, foreignKey, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { domainClassifications, domains } from "./domain.schema";
import { permissionTables } from "./permission_table.schema";

export const userTypes = pgTable(
  "user_types",
  {
    id: uuid("id").defaultRandom().notNull(),
    displayName: text("display_name").notNull().unique(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "usr_type_pk" })],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    mask: boolean("mask").notNull(),
    deceasedPopulation: boolean("deceased_population").notNull(),
    userTypeId: uuid("user_type_id").notNull(),
    impersonateValue: boolean("impersonate_value").notNull(),
    impersonateExpression: text("impersonate_expression"),
    blocked: boolean("blocked"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_pk" }),
    foreignKey({
      columns: [table.userTypeId],
      foreignColumns: [userTypes.id],
      name: "usr_type_fk",
    }),
  ],
);

export const userCatalogs = pgTable(
  "user_catalogs",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: uuid("user_id").notNull(),
    catalogName: text("catalog_name").notNull(),
    write: boolean("write"),
    readAll: boolean("read_all"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_cat_pk" }),
    unique("usr_cat_uq").on(table.userId, table.catalogName),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "usr_cat_usr_fk",
    }).onDelete("cascade"),
  ],
);

export const userCatalogSchemas = pgTable(
  "user_catalog_schemas",
  {
    id: uuid("id").defaultRandom().notNull(),
    userCatalogId: uuid("user_catalog_id").notNull(),
    schemaName: text("schema_name").notNull(),
    write: boolean("write").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_cat_sch_pk" }),
    unique("usr_cat_sch_uq").on(table.userCatalogId, table.schemaName),
    foreignKey({
      columns: [table.userCatalogId],
      foreignColumns: [userCatalogs.id],
      name: "usr_cat_sch_cat_fk",
    }).onDelete("cascade"),
  ],
);

export const userUniquePopulations = pgTable(
  "user_unique_populations",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: uuid("user_id").notNull(),
    value: integer("value").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_up_pk" }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "usr_up_usr_fk",
    }).onDelete("cascade"),
  ],
);

export const userDomains = pgTable(
  "user_domains",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: uuid("user_id").notNull(),
    domainId: uuid("domain_id").notNull(),
    givenBy: text("given_by"),
    createdAt: timestamp("create_date"),
    lastChangedBy: text("last_changed_by"),
    updatedAt: timestamp("last_change"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_dom_pk" }),
    unique("usr_dom_id_dom_uq").on(table.id, table.domainId),
    unique("usr_dom_uq").on(table.userId, table.domainId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "usr_dom_usr_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domains.id],
      name: "usr_dom_dom_fk",
    }),
  ],
);

export const userDomainClassifications = pgTable(
  "user_domain_classifications",
  {
    userDomainId: uuid("user_domain_id").notNull(),
    domainId: uuid("domain_id").notNull(),
    classificationId: uuid("classification_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userDomainId, table.classificationId], name: "usr_dom_cls_pk" }),
    foreignKey({
      columns: [table.userDomainId],
      foreignColumns: [userDomains.id],
      name: "usr_dom_cls_fk_ud",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.classificationId],
      foreignColumns: [classifications.id],
      name: "usr_dom_cls_fk_cls",
    }),
    foreignKey({
      columns: [table.userDomainId, table.domainId],
      foreignColumns: [userDomains.id, userDomains.domainId],
      name: "usr_dom_cls_fk_ud_dom",
    }),
    foreignKey({
      columns: [table.domainId, table.classificationId],
      foreignColumns: [domainClassifications.domainId, domainClassifications.classificationId],
      name: "usr_dom_cls_fk_dom_cls",
    }),
  ],
);

export const userPermissionTables = pgTable(
  "user_permission_tables",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: uuid("user_id").notNull(),
    permissionTableId: uuid("permission_table_id").notNull(),
    givenBy: text("given_by"),
    lastChangedBy: text("last_changed_by"),
    updatedAt: timestamp("last_change"),
    createdAt: timestamp("create_date"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_pt_pk" }),
    unique("usr_pt_uq").on(table.userId, table.permissionTableId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "usr_pt_usr_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "usr_pt_tbl_fk",
    }),
  ],
);

export const userPermissionTableRowFilters = pgTable(
  "user_permission_table_row_filters",
  {
    id: uuid("id").defaultRandom().notNull(),
    userPermissionTableId: uuid("user_permission_table_id").notNull(),
    kod: text("kod").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_pt_rf_pk" }),
    unique("usr_pt_rf_uq").on(table.userPermissionTableId, table.kod),
    foreignKey({
      columns: [table.userPermissionTableId],
      foreignColumns: [userPermissionTables.id],
      name: "usr_pt_rf_pt_fk",
    }).onDelete("cascade"),
  ],
);

export const userPermissionTableRowFilterValues = pgTable(
  "user_permission_table_row_filter_values",
  {
    id: uuid("id").defaultRandom().notNull(),
    userPermissionTableRowFilterId: uuid("user_permission_table_row_filter_id").notNull(),
    value: jsonb("value").notNull(),
    displayName: text("display_name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_pt_rfv_pk" }),
    foreignKey({
      columns: [table.userPermissionTableRowFilterId],
      foreignColumns: [userPermissionTableRowFilters.id],
      name: "usr_pt_rfv_rf_fk",
    }).onDelete("cascade"),
  ],
);

export const userPermissionGroups = pgTable(
  "user_permission_groups",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: uuid("user_id").notNull(),
    domainId: uuid("domain_id").notNull(),
    givenBy: text("given_by").notNull(),
    registrationDate: timestamp("registration_date").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_pg_pk" }),
    unique("usr_pg_uq").on(table.userId, table.domainId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "usr_pg_usr_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domains.id],
      name: "usr_pg_dom_fk",
    }),
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
