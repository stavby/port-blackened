import { relations, sql } from "drizzle-orm";
import { foreignKey, pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { domains } from "./domain.schema";
import { permissionTableRowFilters, permissionTables } from "./permission_table.schema";
import {
  createDomainClassificationColumns,
  createDomainsColumns,
  createPermissionVisibilityColumns,
  createRowFilterValuePayloadColumns,
  objectId,
} from "./shared.schema";

export const permissionGroups = pgTable(
  "permission_groups",
  {
    id: objectId("id"),
    name: text("name").notNull().unique(),
    ownerId: text("owner_id").notNull(),
    ownerName: text("owner_name").notNull(),
    description: text("description").notNull().default(""),
    color: text("color").notNull(),
    ...createPermissionVisibilityColumns(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "perm_grp_pk" })],
);

export const permissionGroupCoOwners = pgTable(
  "permission_group_co_owners",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupId: text("permission_group_id").notNull(),
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
    unique("perm_grp_co_uq").on(table.permissionGroupId, table.userId),
  ],
);

export const permissionGroupDomains = pgTable(
  "permission_group_domains",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupId: text("permission_group_id").notNull(),
    ...createDomainsColumns(),
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
    ...createDomainClassificationColumns(),
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

export const permissionGroupRowFilterValues = pgTable(
  "permission_group_row_filter_values",
  {
    id: uuid("id").defaultRandom().notNull(),
    permissionGroupId: text("permission_group_id").notNull(),
    ...createRowFilterValuePayloadColumns(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "perm_grp_rfv_pk" }),
    foreignKey({
      columns: [table.permissionGroupId],
      foreignColumns: [permissionGroups.id],
      name: "perm_grp_rfv_grp_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.permissionTableId],
      foreignColumns: [permissionTables.id],
      name: "perm_grp_rfv_tbl_fk",
    }),
    foreignKey({
      columns: [table.permissionTableRowFilterId, table.permissionTableId],
      foreignColumns: [permissionTableRowFilters.id, permissionTableRowFilters.permissionTableId],
      name: "perm_grp_rfv_rf_tbl_fk",
    }),
  ],
);

export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  coOwners: many(permissionGroupCoOwners),
  domains: many(permissionGroupDomains),
  rowFilterValues: many(permissionGroupRowFilterValues),
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

export const permissionGroupRowFilterValuesRelations = relations(permissionGroupRowFilterValues, ({ one }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissionGroupRowFilterValues.permissionGroupId],
    references: [permissionGroups.id],
  }),
  permissionTable: one(permissionTables, {
    fields: [permissionGroupRowFilterValues.permissionTableId],
    references: [permissionTables.id],
  }),
  rowFilter: one(permissionTableRowFilters, {
    fields: [permissionGroupRowFilterValues.permissionTableRowFilterId, permissionGroupRowFilterValues.permissionTableId],
    references: [permissionTableRowFilters.id, permissionTableRowFilters.permissionTableId],
  }),
}));
