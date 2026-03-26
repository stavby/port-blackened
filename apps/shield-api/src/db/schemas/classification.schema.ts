import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { objectId } from "./shared.schema";

export const classifications = pgTable(
  "classifications",
  {
    id: objectId("id"),
    displayName: text("display_name").notNull().unique(),
    description: text("description").notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "cls_pk" })],
);
