import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),

    name: text("name").notNull(),

    slug: text("slug").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("category_slug_uidx").on(table.slug),
  ],
);