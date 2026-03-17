import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { classifications, domains } from "./organization.schema";

export const permissionTableRowFilterTypeEnum = pgEnum("permission_table_row_filter_type", ["integer", "string", "boolean"]);
export const permissionTableRowFilterQueryBuilderTypeEnum = pgEnum("permission_table_row_filter_query_builder_type", [
  "select",
  "tree",
  "boolean",
]);

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  color: text("color").notNull(),
  displayOrder: integer("display_order").notNull(),
});

export const permissionTables = pgTable("permission_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const permissionTableRowFilters = pgTable("permission_table_row_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  permissionTableId: uuid("permission_table_id")
    .notNull()
    .references(() => permissionTables.id),
  kod: text("kod").notNull(),
  displayName: text("display_name").notNull(),
  dimensionsTable: text("dimensions_table").notNull(),
  type: permissionTableRowFilterTypeEnum("type").notNull(),
  queryBuilderType: permissionTableRowFilterQueryBuilderTypeEnum("query_builder_type").notNull(),
},
  (table) => [
    unique("permission_table_filter_unique").on(table.permissionTableId, table.kod),
  ],
);

export const permissionTableKeys = pgTable("permission_table_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  permissionTableId: uuid("permission_table_id")
    .notNull()
    .references(() => permissionTables.id),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  trinoType: text("trino_type").notNull(),
});

export const permissionGroups = pgTable("permission_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull(),
  mask: boolean("mask").notNull(),
  deceasedPopulation: boolean("deceased_population").notNull(),
});

export const permissionGroupCoOwners = pgTable("permission_group_co_owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  permissionGroupId: uuid("permission_group_id")
    .notNull()
    .references(() => permissionGroups.id),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
});

export const permissionGroupDomains = pgTable("permission_group_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  permissionGroupId: uuid("permission_group_id")
    .notNull()
    .references(() => permissionGroups.id),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id),
  givenBy: text("given_by"),
  createdAt: timestamp("create_date"),
  lastChangedBy: text("last_changed_by"),
  updatedAt: timestamp("last_change"),
},
  (table) => [
    unique("permission_group_domain_unique").on(table.permissionGroupId, table.domainId),
  ],
);

export const permissionGroupDomainClassifications = pgTable(
  "permission_group_domain_classifications",
  {
    permissionGroupDomainId: uuid("permission_group_domain_id")
      .notNull()
      .references(() => permissionGroupDomains.id),
    classificationId: uuid("classification_id")
      .notNull()
      .references(() => classifications.id),
  },
  (table) => [
    primaryKey({ columns: [table.permissionGroupDomainId, table.classificationId] }),
  ],
);

export const permissionGroupPermissionTables = pgTable("permission_group_permission_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  permissionGroupId: uuid("permission_group_id")
    .notNull()
    .references(() => permissionGroups.id),
  permissionTableId: uuid("permission_table_id")
    .notNull()
    .references(() => permissionTables.id),
  givenBy: text("given_by"),
  lastChangedBy: text("last_changed_by"),
  updatedAt: timestamp("last_change"),
  createdAt: timestamp("create_date"),
},
  (table) => [
    unique("permission_group_permission_table_unique").on(
      table.permissionGroupId,
      table.permissionTableId,
    ),
  ],
);

export const permissionGroupPermissionTableRowFilters = pgTable("permission_group_permission_table_row_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  permissionGroupPermissionTableId: uuid("permission_group_permission_table_id")
    .notNull()
    .references(() => permissionGroupPermissionTables.id),
  kod: text("kod").notNull(),
},
  (table) => [
    unique("permission_group_permission_table_row_filter_unique").on(
      table.permissionGroupPermissionTableId,
      table.kod,
    ),
  ],
);

export const permissionGroupPermissionTableRowFilterValues = pgTable(
  "permission_group_permission_table_row_filter_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    permissionGroupPermissionTableRowFilterId: uuid("permission_group_permission_table_row_filter_id")
      .notNull()
      .references(() => permissionGroupPermissionTableRowFilters.id),
    value: jsonb("value").notNull(),
    displayName: text("display_name").notNull(),
  },
);

export const rolesRelations = relations(roles, () => ({}));

export const permissionTablesRelations = relations(permissionTables, ({ many }) => ({
  rowFilters: many(permissionTableRowFilters),
  permissionKeys: many(permissionTableKeys),
  permissionGroupPermissionTables: many(permissionGroupPermissionTables),
}));

export const permissionTableRowFiltersRelations = relations(permissionTableRowFilters, ({ one }) => ({
  permissionTable: one(permissionTables, {
    fields: [permissionTableRowFilters.permissionTableId],
    references: [permissionTables.id],
  }),
}));

export const permissionTableKeysRelations = relations(permissionTableKeys, ({ one }) => ({
  permissionTable: one(permissionTables, {
    fields: [permissionTableKeys.permissionTableId],
    references: [permissionTables.id],
  }),
}));

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
