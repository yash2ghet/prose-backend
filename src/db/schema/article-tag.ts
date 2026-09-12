import {
  pgTable,
  text,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

import { article } from "./article";
import { tag } from "./tag";

export const articleTag = pgTable(
  "article_tag",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, {
        onDelete: "cascade",
      }),

    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, {
        onDelete: "cascade",
      }),
  },

  (table) => [
    primaryKey({
      columns: [
        table.articleId,
        table.tagId,
      ],
    }),

    index("article_tag_article_id_idx").on(
      table.articleId,
    ),

    index("article_tag_tag_id_idx").on(
      table.tagId,
    ),
  ],
);