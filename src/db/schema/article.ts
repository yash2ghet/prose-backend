import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./user";
import { category } from "./category";

export const articleStatus = pgEnum("article_status", [
  "draft",
  "published",
]);

export const article = pgTable(
  "article",
  {
    id: text("id").primaryKey(),

    title: text("title").notNull(),

    slug: text("slug").notNull(),

    excerpt: text("excerpt"),

    content: text("content").notNull(),

    status: articleStatus("status")
      .default("draft")
      .notNull(),

    featured: boolean("featured")
      .default(false)
      .notNull(),

    featuredImage: text("featured_image"),

    categoryId: text("category_id").references(
      () => category.id,
      {
        onDelete: "set null",
      },
    ),

    authorId: text("author_id").references(
      () => user.id,
      {
        onDelete: "set null",
      },
    ),

    seoTitle: text("seo_title"),

    seoDescription: text("seo_description"),

    publishedAt: timestamp("published_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },

  (table) => [
    uniqueIndex("article_slug_uidx").on(table.slug),

    index("article_category_id_idx").on(
      table.categoryId,
    ),

    index("article_author_id_idx").on(
      table.authorId,
    ),

    index("article_status_idx").on(
      table.status,
    ),

    index("article_published_at_idx").on(
      table.publishedAt,
    ),
  ],
);