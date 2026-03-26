import { relations } from "drizzle-orm";
import { boolean, foreignKey, integer, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { domains } from "./domain.schema";
import { permissionTableRowFilters, permissionTables } from "./permission_table.schema";
import { permissionGroups } from "./permission_groups.schema";
import {
  createDomainClassificationColumns,
  createDomainsColumns,
  createPermissionVisibilityColumns,
  createRowFilterValuePayloadColumns,
} from "./shared.schema";

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
    userId: text("user_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    ...createPermissionVisibilityColumns(),
    userTypeId: uuid("user_type_id").notNull(),
    canImpersonate: boolean("can_impersonate").notNull().default(false),
    impersonateExpression: text("impersonate_expression"),
    isBlocked: boolean("is_blocked"),
    isSapPermitted: boolean("is_sap_permitted").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.userId], name: "usr_pk" }),
    unique("usr_id_uq").on(table.id),
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
    userId: text("user_id").notNull(),
    catalogName: text("catalog_name").notNull(),
    writeAll: boolean("write_all"),
    readAll: boolean("read_all"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_cat_pk" }),
    unique("usr_cat_uq").on(table.userId, table.catalogName),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
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
    userId: text("user_id").notNull(),
    value: integer("value").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.value], name: "usr_up_pk" }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "usr_up_usr_fk",
    }).onDelete("cascade"),
  ],
);

export const userDomains = pgTable(
  "user_domains",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull(),
    ...createDomainsColumns(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_dom_pk" }),
    unique("usr_dom_uq").on(table.userId, table.domainId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
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
    ...createDomainClassificationColumns(),
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
  ],
);

export const userRowFilterValues = pgTable(
  "user_row_filter_values",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull(),
    permissionTableId: uuid("permission_table_id").notNull(),
    permissionTableRowFilterId: uuid("permission_table_row_filter_id").notNull(),
    ...createRowFilterValuePayloadColumns(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_rfv_pk" }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "usr_rfv_usr_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "usr_rfv_tbl_fk",
    }),
    foreignKey({
      columns: [table.permissionTableRowFilterId, table.permissionTableId],
      foreignColumns: [permissionTableRowFilters.id, permissionTableRowFilters.permissionTableId],
      name: "usr_rfv_rf_tbl_fk",
    }),
  ],
);

export const userPermissionGroups = pgTable(
  "user_permission_groups",
  {
    id: uuid("id").defaultRandom().notNull(),
    userId: text("user_id").notNull(),
    permissionGroupId: uuid("permission_group_id").notNull(),
    givenBy: text("given_by").notNull(),
    registrationDate: timestamp("registration_date").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "usr_pg_pk" }),
    unique("usr_pg_uq").on(table.userId, table.permissionGroupId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "usr_pg_usr_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: "usr_pg_pg_fk",
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
  rowFilterValues: many(userRowFilterValues),
  permissionGroups: many(userPermissionGroups),
}));

export const userTypesRelations = relations(userTypes, ({ many }) => ({
  users: many(users),
}));

export const userCatalogsRelations = relations(userCatalogs, ({ one, many }) => ({
  user: one(users, {
    fields: [userCatalogs.userId],
    references: [users.userId],
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
    references: [users.userId],
  }),
}));

export const userDomainsRelations = relations(userDomains, ({ one, many }) => ({
  user: one(users, {
    fields: [userDomains.userId],
    references: [users.userId],
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

export const userRowFilterValuesRelations = relations(userRowFilterValues, ({ one }) => ({
  user: one(users, {
    fields: [userRowFilterValues.userId],
    references: [users.userId],
  }),
  permissionTable: one(permissionTables, {
    fields: [userRowFilterValues.permissionTableId],
    references: [permissionTables.id],
  }),
  rowFilter: one(permissionTableRowFilters, {
    fields: [userRowFilterValues.permissionTableRowFilterId, userRowFilterValues.permissionTableId],
    references: [permissionTableRowFilters.id, permissionTableRowFilters.permissionTableId],
  }),
}));

export const userPermissionGroupsRelations = relations(userPermissionGroups, ({ one }) => ({
  user: one(users, {
    fields: [userPermissionGroups.userId],
    references: [users.userId],
  }),
  permissionGroup: one(permissionGroups, {
    fields: [userPermissionGroups.permissionGroupId],
    references: [permissionGroups.id],
  }),
}));
