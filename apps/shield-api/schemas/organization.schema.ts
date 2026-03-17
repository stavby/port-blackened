import { relations } from "drizzle-orm";
import { pgTable, text, uuid, primaryKey } from "drizzle-orm/pg-core";

export const classifications = pgTable("classifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
});

export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const domainClassifications = pgTable(
  "domain_classifications",
  {
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id),
    classificationId: uuid("classification_id")
      .notNull()
      .references(() => classifications.id),
  },
  (table) => [
    primaryKey({ columns: [table.domainId, table.classificationId] }),
  ],
);

export const domainsRelations = relations(domains, ({ many }) => ({
  classifications: many(domainClassifications),
}));

export const classificationsRelations = relations(classifications, ({ many }) => ({
  domains: many(domainClassifications),
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
