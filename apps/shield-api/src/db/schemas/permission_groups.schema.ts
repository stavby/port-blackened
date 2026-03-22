import { relations } from "drizzle-orm";
import { boolean, foreignKey, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { domains } from "./domain.schema";
import { permissionTables } from "./permission_table.schema";

export const permissionGroups = pgTable(
  "permission_groups",
  {
    id: uuid("id").defaultRandom().notNull(),
    name: text("name").notNull().unique(),
    ownerId: text("owner_id").notNull(),
    ownerName: text("owner_name").notNull(),
    description: text("description").notNull().default(""),
    color: text("color").notNull(),
    mask: boolean("mask").notNull(),
    deceasedPopulation: boolean("deceased_population").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "perm_grp_pk" })],
);

export const permissionGroupCoOwners = pgTable(
  "permission_group_co_owners",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupId: uuid("permission_group_id").notNull(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_grp_co_pk" }),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: "perm_grp_co_grp_fk",
    }),
  ],
);

export const permissionGroupDomains = pgTable(
  "permission_group_domains",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupId: uuid("permission_group_id").notNull(),
    domainId: uuid("domain_id").notNull(),
    givenBy: text("given_by"),
    createdAt: timestamp("create_date"),
    lastChangedBy: text("last_changed_by"),
    updatedAt: timestamp("last_change"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_grp_dom_pk" }),
    unique("perm_grp_dom_uq").on(table.permissionGroupId, table.domainId),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: "perm_grp_dom_grp_fk",
    }),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domains.id],
      name: "perm_grp_dom_dom_fk",
    }),
  ],
);

export const permissionGroupDomainClassifications = pgTable(
  "permission_group_domain_classifications",
  {
    permissionGroupDomainId: uuid("permission_group_domain_id").notNull(),
    classificationId: uuid("classification_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.permissionGroupDomainId, table.classificationId], name: "perm_grp_dom_cls_pk" }),
    foreignKey({
      columns: [table.permissionGroupDomainId],
      foreignColumns: [permissionGroupDomains.id],
      name: "perm_grp_dom_cls_dom_fk",
    }),
    foreignKey({
      columns: [table.classificationId],
      foreignColumns: [classifications.id],
      name: "perm_grp_dom_cls_cls_fk",
    }),
  ],
);

export const permissionGroupPermissionTables = pgTable(
  "permission_group_permission_tables",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupId: uuid("permission_group_id").notNull(),
    permissionTableId: uuid("permission_table_id").notNull(),
    givenBy: text("given_by"),
    lastChangedBy: text("last_changed_by"),
    updatedAt: timestamp("last_change"),
    createdAt: timestamp("create_date"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_grp_pt_pk" }),
    unique("perm_grp_pt_uq").on(table.permissionGroupId, table.permissionTableId),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: "perm_grp_pt_grp_fk",
    }),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "perm_grp_pt_tbl_fk",
    }),
  ],
);

export const permissionGroupPermissionTableRowFilters = pgTable(
  "permission_group_permission_table_row_filters",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupPermissionTableId: uuid("permission_group_permission_table_id").notNull(),
    kod: text("kod").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_grp_pt_rf_pk" }),
    unique("perm_grp_pt_rf_uq").on(table.permissionGroupPermissionTableId, table.kod),
    foreignKey({
      columns: [table.permissionGroupPermissionTableId],
      foreignColumns: [permissionGroupPermissionTables.id],
      name: "perm_grp_pt_rf_pt_fk",
    }),
  ],
);

export const permissionGroupPermissionTableRowFilterValues = pgTable(
  "permission_group_permission_table_row_filter_values",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupPermissionTableRowFilterId: uuid("permission_group_permission_table_row_filter_id").notNull(),
    value: jsonb("value").notNull(),
    displayName: text("display_name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_grp_pt_rfv_pk" }),
    foreignKey({
      columns: [table.permissionGroupPermissionTableRowFilterId],
      foreignColumns: [permissionGroupPermissionTableRowFilters.id],
      name: "perm_grp_pt_rfv_rf_fk",
    }),
  ],
);

export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  coOwners: many(permissionGroupCoOwners),
  domains: many(permissionGroupDomains),
  permissionTables: many(permissionGroupPermissionTables),
}));

export const permissionGroupCoOwnersRelations = relations(permissionGroupCoOwners, ({ one }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissionGroupCoOwners.permissionGroupId],
    references: [permissionGroups.id],
  }),
}));

export const permissionGroupDomainsRelations = relations(permissionGroupDomains, ({ one, many }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissionGroupDomains.permissionGroupId],
    references: [permissionGroups.id],
  }),
  domain: one(domains, {
    fields: [permissionGroupDomains.domainId],
    references: [domains.id],
  }),
  classifications: many(permissionGroupDomainClassifications),
}));

export const permissionGroupDomainClassificationsRelations = relations(permissionGroupDomainClassifications, ({ one }) => ({
  permissionGroupDomain: one(permissionGroupDomains, {
    fields: [permissionGroupDomainClassifications.permissionGroupDomainId],
    references: [permissionGroupDomains.id],
  }),
  classification: one(classifications, {
    fields: [permissionGroupDomainClassifications.classificationId],
    references: [classifications.id],
  }),
}));

export const permissionGroupPermissionTablesRelations = relations(permissionGroupPermissionTables, ({ one, many }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissionGroupPermissionTables.permissionGroupId],
    references: [permissionGroups.id],
  }),
  permissionTable: one(permissionTables, {
    fields: [permissionGroupPermissionTables.permissionTableId],
    references: [permissionTables.id],
  }),
  rowFilters: many(permissionGroupPermissionTableRowFilters),
}));

export const permissionGroupPermissionTableRowFiltersRelations = relations(permissionGroupPermissionTableRowFilters, ({ one, many }) => ({
  permissionGroupPermissionTable: one(permissionGroupPermissionTables, {
    fields: [permissionGroupPermissionTableRowFilters.permissionGroupPermissionTableId],
    references: [permissionGroupPermissionTables.id],
  }),
  values: many(permissionGroupPermissionTableRowFilterValues),
}));

export const permissionGroupPermissionTableRowFilterValuesRelations = relations(
  permissionGroupPermissionTableRowFilterValues,
  ({ one }) => ({
    rowFilter: one(permissionGroupPermissionTableRowFilters, {
      fields: [permissionGroupPermissionTableRowFilterValues.permissionGroupPermissionTableRowFilterId],
      references: [permissionGroupPermissionTableRowFilters.id],
    }),
  }),
);
