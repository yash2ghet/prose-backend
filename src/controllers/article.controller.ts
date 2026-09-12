import type { Request, Response } from "express";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../config/db";

import {
  article,
  category,
  user,
} from "../db/schema";

function createId() {
  return crypto.randomUUID();
}

function calculateReadTime(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText
    ? plainText.split(" ").length
    : 0;

  return Math.max(1, Math.ceil(words / 200));
}

function normalizeStatus(
  status: unknown,
): "draft" | "published" {
  return status === "published"
    ? "published"
    : "draft";
}

function getSingleParam(
  value: string | string[] | undefined,
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function serializeArticle(
  item: any,
) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.content,
    status:
      item.status === "published"
        ? "Published"
        : "Draft",
    featured: item.featured,
    featuredImage: item.featuredImage,
    categoryId: item.categoryId,
    authorId: item.authorId,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    readTime: calculateReadTime(
      item.content ?? "",
    ),

    category: item.category
      ? {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
        }
      : null,

    author: item.author
      ? {
          id: item.author.id,
          name: item.author.name,
          email: item.author.email,
          image: item.author.image,
        }
      : null,
  };
}

async function getArticleById(
  id: string,
) {
  const result = await db
    .select({
      article,
      category,
      author: user,
    })
    .from(article)
    .leftJoin(
      category,
      eq(article.categoryId, category.id),
    )
    .leftJoin(
      user,
      eq(article.authorId, user.id),
    )
    .where(eq(article.id, id))
    .limit(1);

  if (!result[0]) {
    return null;
  }

  return {
    ...result[0].article,
    category: result[0].category,
    author: result[0].author,
  };
}

export async function getArticles(
  req: Request,
  res: Response,
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : "";

    const categorySlug =
      typeof req.query.category === "string"
        ? req.query.category
        : "";

    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort
        : "newest";

    const page = Math.max(
      1,
      Number(req.query.page) || 1,
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number(req.query.limit) || 9,
      ),
    );

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(
            article.title,
            `%${search}%`,
          ),
          ilike(
            article.excerpt,
            `%${search}%`,
          ),
        ),
      );
    }

    if (
      status === "draft" ||
      status === "published"
    ) {
      conditions.push(
        eq(article.status, status),
      );
    }

    if (categorySlug) {
      conditions.push(
        eq(
          category.slug,
          categorySlug,
        ),
      );
    }

    const whereClause =
      conditions.length > 0
        ? and(...conditions)
        : undefined;

    const orderBy =
      sort === "oldest"
        ? asc(article.createdAt)
        : sort === "updated"
          ? desc(article.updatedAt)
          : desc(article.createdAt);

    const countResult = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
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
      .where(whereClause);

    const totalCount =
      countResult[0]?.count ?? 0;

    const rows = await db
      .select({
        article,
        category,
        author: user,
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
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(
        (page - 1) * limit,
      );

    const data = rows.map((row) =>
      serializeArticle({
        ...row.article,
        category: row.category,
        author: row.author,
      }),
    );

    return res.json({
      data,
      page,
      limit,

      count: totalCount,

      totalPages: Math.ceil(
        totalCount / limit,
      ),
    });
  } catch (error) {
    console.error(
      "Get articles error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch articles",
    });
  }
}

export async function getArticle(
  req: Request,
  res: Response,
) {
  try {
    const item = await getArticleById(
      getSingleParam(req.params.id),
    );

    if (!item) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.json({
      data: serializeArticle(item),
    });
  } catch (error) {
    console.error(
      "Get article error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch article",
    });
  }
}

export async function getArticleBySlug(
  req: Request,
  res: Response,
) {
  try {
    const slug = getSingleParam(
      req.params.slug,
    );

    const result = await db
      .select({
        article,
        category,
        author: user,
      })
      .from(article)
      .leftJoin(
        category,
        eq(article.categoryId, category.id),
      )
      .leftJoin(
        user,
        eq(article.authorId, user.id),
      )
      .where(
        and(
          eq(
            article.slug,
            slug,
          ),
          eq(
            article.status,
            "published",
          ),
        ),
      )
      .limit(1);

    if (!result[0]) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.json({
      data: serializeArticle({
        ...result[0].article,
        category: result[0].category,
        author: result[0].author,
      }),
    });
  } catch (error) {
    console.error(
      "Get article by slug error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch article",
    });
  }
}

export async function createArticle(
  req: Request,
  res: Response,
) {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      categoryId,
      featured,
      featuredImage,
      seoTitle,
      seoDescription,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (
      typeof slug !== "string" ||
      !slug.trim()
    ) {
      return res.status(400).json({
        message: "Slug is required",
      });
    }

    if (
      typeof content !== "string"
    ) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const normalizedStatus =
      normalizeStatus(status);

    const existingSlug = await db
      .select({ id: article.id })
      .from(article)
      .where(eq(article.slug, slug.trim()))
      .limit(1);

    if (existingSlug.length > 0) {
      return res.status(409).json({
        message:
          "An article with this slug already exists",
      });
    }

    if (categoryId) {
      const existingCategory =
        await db
          .select({ id: category.id })
          .from(category)
          .where(
            eq(
              category.id,
              categoryId,
            ),
          )
          .limit(1);

      if (!existingCategory.length) {
        return res.status(400).json({
          message: "Category not found",
        });
      }
    }

    const now = new Date();

    const inserted = await db
      .insert(article)
      .values({
        id: createId(),
        title: title.trim(),
        slug: slug.trim(),
        excerpt:
          typeof excerpt === "string"
            ? excerpt.trim()
            : null,
        content,
        status: normalizedStatus,
        featured:
          typeof featured === "boolean"
            ? featured
            : false,
        featuredImage:
          typeof featuredImage === "string"
            ? featuredImage
            : null,
        categoryId:
          typeof categoryId === "string"
            ? categoryId
            : null,
        authorId: res.locals.user.id,
        seoTitle:
          typeof seoTitle === "string"
            ? seoTitle.trim()
            : null,
        seoDescription:
          typeof seoDescription === "string"
            ? seoDescription.trim()
            : null,
        publishedAt:
          normalizedStatus === "published"
            ? now
            : null,
      })
      .returning();

    return res.status(201).json({
      data: serializeArticle({
        ...inserted[0],
        category: null,
        author: res.locals.user,
      }),
    });
  } catch (error) {
    console.error(
      "Create article error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to create article",
    });
  }
}

export async function updateArticle(
  req: Request,
  res: Response,
) {
  try {
    const articleId = getSingleParam(
      req.params.id,
    );

    const existing =
      await getArticleById(articleId);

    if (!existing) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      status,
      categoryId,
      featured,
      featuredImage,
      seoTitle,
      seoDescription,
    } = req.body;

    if (
      slug !== undefined &&
      typeof slug !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid slug",
      });
    }

    const nextSlug =
      typeof slug === "string"
        ? slug.trim()
        : existing.slug;

    if (nextSlug !== existing.slug) {
      const duplicate = await db
        .select({ id: article.id })
        .from(article)
        .where(
          and(
            eq(article.slug, nextSlug),
          ),
        )
        .limit(1);

      if (
        duplicate.length > 0 &&
        duplicate[0].id !== existing.id
      ) {
        return res.status(409).json({
          message:
            "An article with this slug already exists",
        });
      }
    }

    const normalizedStatus =
      status === undefined
        ? existing.status
        : normalizeStatus(status);

    const now = new Date();

    const updated = await db
      .update(article)
      .set({
        ...(title !== undefined && {
          title: String(title).trim(),
        }),

        slug: nextSlug,

        ...(excerpt !== undefined && {
          excerpt:
            excerpt === null
              ? null
              : String(excerpt).trim(),
        }),

        ...(content !== undefined && {
          content: String(content),
        }),

        status: normalizedStatus,

        ...(featured !== undefined && {
          featured: Boolean(featured),
        }),

        ...(featuredImage !== undefined && {
          featuredImage:
            featuredImage === null
              ? null
              : String(featuredImage),
        }),

        ...(categoryId !== undefined && {
          categoryId:
            categoryId === null ||
            categoryId === ""
              ? null
              : String(categoryId),
        }),

        ...(seoTitle !== undefined && {
          seoTitle:
            seoTitle === null
              ? null
              : String(seoTitle).trim(),
        }),

        ...(seoDescription !==
          undefined && {
          seoDescription:
            seoDescription === null
              ? null
              : String(
                  seoDescription,
                ).trim(),
        }),

        publishedAt:
          normalizedStatus === "published"
            ? existing.publishedAt ??
              now
            : null,

        updatedAt: now,
      })
      .where(eq(article.id, existing.id))
      .returning();

    const result =
      await getArticleById(
        updated[0].id,
      );

    return res.json({
      data: serializeArticle(result),
    });
  } catch (error) {
    console.error(
      "Update article error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to update article",
    });
  }
}

export async function deleteArticle(
  req: Request,
  res: Response,
) {
  try {
    const articleId = getSingleParam(
      req.params.id,
    );

    const deleted = await db
      .delete(article)
      .where(
        eq(
          article.id,
          articleId,
        ),
      )
      .returning({
        id: article.id,
      });

    if (!deleted.length) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete article error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to delete article",
    });
  }
}

export async function duplicateArticle(
  req: Request,
  res: Response,
) {
  try {
    const articleId = getSingleParam(
      req.params.id,
    );

    const existing =
      await getArticleById(articleId);

    if (!existing) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    const baseSlug = `${existing.slug}-copy`;

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const found = await db
        .select({ id: article.id })
        .from(article)
        .where(eq(article.slug, slug))
        .limit(1);

      if (!found.length) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const inserted = await db
      .insert(article)
      .values({
        id: createId(),
        title: `${existing.title} copy`,
        slug,
        excerpt: existing.excerpt,
        content: existing.content,
        status: "draft",
        featured: false,
        featuredImage:
          existing.featuredImage,
        categoryId:
          existing.categoryId,
        authorId:
          res.locals.user.id,
        seoTitle: existing.seoTitle,
        seoDescription:
          existing.seoDescription,
        publishedAt: null,
      })
      .returning();

    const result =
      await getArticleById(
        inserted[0].id,
      );

    return res.status(201).json({
      data: serializeArticle(result),
    });
  } catch (error) {
    console.error(
      "Duplicate article error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to duplicate article",
    });
  }
}