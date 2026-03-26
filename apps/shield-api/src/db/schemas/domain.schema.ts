import { relations, sql } from "drizzle-orm";
import { foreignKey, pgTable, text, uuid, primaryKey } from "drizzle-orm/pg-core";
import { classifications } from "./classification.schema";
import { objectId } from "./shared.schema";

export const domains = pgTable(
  "domains",
  {
    id: objectId("id"),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "dom_pk" })],
);

export const domainClassifications = pgTable(
  "domain_classifications",
  {
    domainId: text("domain_id").notNull(),
    classificationId: text("classification_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.domainId, table.classificationId], name: "dom_cls_pk" }),
    foreignKey({
      columns: [table.domainId],
      foreignColumns: [domains.id],
      name: "dom_cls_dom_fk",
    }),
    foreignKey({
      columns: [table.classificationId],
      foreignColumns: [classifications.id],
      name: "dom_cls_cls_fk",
    }),
  ],
);

export const domainsRelations = relations(domains, ({ many }) => ({
  classifications: many(domainClassifications),
}));

export const domainClassificationsRelations = relations(domainClassifications, ({ one }) => ({
  domain: one(domains, {
    fields: [domainClassifications.domainId],
    references: [domains.id],
  }),
  classification: one(classifications, {
    fields: [domainClassifications.classificationId],
    references: [classifications.id],
  }),
}));
