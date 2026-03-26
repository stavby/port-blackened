import { ObjectIdBrand } from "@port/shield-schemas";
import { boolean, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ObjectId } from "mongodb";

export const objectId = (name: string) =>
  text(name)
    .notNull()
    .$default(() => new ObjectId().toHexString())
    .$type<ObjectIdBrand>();

export const createPermissionVisibilityColumns = () => ({
  shouldApplyMasking: boolean("should_apply_masking").notNull().default(false),
  canViewDeceased: boolean("can_view_deceased").notNull().default(false),
});

export const createMetaAuditColumns = () => ({
  givenBy: text("given_by"),
  createdAt: timestamp("created_at"),
  lastUpdatedBy: text("last_updated_by"),
  updatedAt: timestamp("updated_at"),
});

export const createDomainsColumns = () => ({
  domainId: text("domain_id").notNull(),
  ...createMetaAuditColumns(),
});

export const createDomainClassificationColumns = () => ({
  classificationId: text("classification_id").notNull(),
});

export const createRowFilterValuePayloadColumns = () => ({
  permissionTableId: text("permission_table_id").notNull(),
  permissionTableRowFilterId: uuid("permission_table_row_filter_id").notNull(),
  value: text("value").notNull(),
  displayName: text("display_name").notNull(),
  ...createMetaAuditColumns(),
});
