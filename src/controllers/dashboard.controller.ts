import type {
  Request,
  Response,
} from "express";

import {
  count,
  desc,
  eq,
} from "drizzle-orm";

import { db } from "../config/db";

import {
  article,
  category,
  user,
} from "../db/schema";

export async function getDashboard(
  _req: Request,
  res: Response,
) {
  try {
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      totalCategories,
      recentArticles,
    ] = await Promise.all([
      db
        .select({
          count: count(),
        })
        .from(article),

      db
        .select({
          count: count(),
        })
        .from(article)
        .where(
          eq(
            article.status,
            "published",
          ),
        ),

      db
        .select({
          count: count(),
        })
        .from(article)
        .where(
          eq(
            article.status,
            "draft",
          ),
        ),

      db
        .select({
          count: count(),
        })
        .from(category),

      db
        .select({
          id: article.id,
          title: article.title,
          status: article.status,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          category: category.name,
          author: user.name,
        })
        .from(article)
        .leftJoin(
          category,
          eq(
            article.categoryId,
            category.id,
          ),
        )
        .leftJoin(
          user,
          eq(
            article.authorId,
            user.id,
          ),
        )
        .orderBy(
          desc(article.updatedAt),
        )
        .limit(5),
    ]);

    return res.json({
      data: {
        stats: {
          totalArticles:
            totalArticles[0]?.count ?? 0,

          published:
            publishedArticles[0]?.count ??
            0,

          drafts:
            draftArticles[0]?.count ?? 0,

          categories:
            totalCategories[0]?.count ??
            0,
        },

        recentArticles,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch dashboard data",
    });
  }
}