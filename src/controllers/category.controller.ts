import type {
  Request,
  Response,
} from "express";

import {
  asc,
  eq,
} from "drizzle-orm";

import { db } from "../config/db";

import {
  article,
  category,
} from "../db/schema";

function createId() {
  return crypto.randomUUID();
}

function getParamId(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

export async function getCategories(
  _req: Request,
  res: Response,
) {
  try {
    const rows = await db
      .select({
        id: category.id,
        name: category.name,
        slug: category.slug,
        createdAt: category.createdAt,
      })
      .from(category)
      .orderBy(asc(category.name));

    const result = await Promise.all(
      rows.map(async (item) => {
        const articles =
          await db
            .select({
              id: article.id,
            })
            .from(article)
            .where(
              eq(
                article.categoryId,
                item.id,
              ),
            );

        return {
          ...item,
          blogs: articles.length,
        };
      }),
    );

    return res.json({
      data: result,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch categories",
    });
  }
}

export async function getCategory(
  req: Request,
  res: Response,
) {
  try {
    const categoryId =
      getParamId(req.params.id);

    const result = await db
      .select()
      .from(category)
      .where(
        eq(
          category.id,
          categoryId,
        ),
      )
      .limit(1);

    if (!result.length) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json({
      data: result[0],
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch category",
    });
  }
}

export async function createCategory(
  req: Request,
  res: Response,
) {
  try {
    const { name, slug } =
      req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Name is required",
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

    const existing = await db
      .select({
        id: category.id,
      })
      .from(category)
      .where(
        eq(
          category.slug,
          slug.trim(),
        ),
      )
      .limit(1);

    if (existing.length) {
      return res.status(409).json({
        message:
          "A category with this slug already exists",
      });
    }

    const inserted = await db
      .insert(category)
      .values({
        id: createId(),
        name: name.trim(),
        slug: slug.trim(),
      })
      .returning();

    return res.status(201).json({
      data: {
        ...inserted[0],
        blogs: 0,
      },
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to create category",
    });
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
) {
  try {
    const { name, slug } =
      req.body;
    const categoryId =
      getParamId(req.params.id);

    const existing = await db
      .select()
      .from(category)
      .where(
        eq(
          category.id,
          categoryId,
        ),
      )
      .limit(1);

    if (!existing.length) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (
      slug !== undefined &&
      typeof slug !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid slug",
      });
    }

    const nextSlug =
      slug !== undefined
        ? slug.trim()
        : existing[0].slug;

    if (
      nextSlug !== existing[0].slug
    ) {
      const duplicate =
        await db
          .select({
            id: category.id,
          })
          .from(category)
          .where(
            eq(
              category.slug,
              nextSlug,
            ),
          )
          .limit(1);

      if (duplicate.length) {
        return res.status(409).json({
          message:
            "A category with this slug already exists",
        });
      }
    }

    const updated = await db
      .update(category)
      .set({
        ...(name !== undefined && {
          name: String(name).trim(),
        }),
        slug: nextSlug,
        updatedAt: new Date(),
      })
      .where(
        eq(
          category.id,
          categoryId,
        ),
      )
      .returning();

    return res.json({
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to update category",
    });
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
) {
  try {
    const categoryId =
      getParamId(req.params.id);

    const deleted = await db
      .delete(category)
      .where(
        eq(
          category.id,
          categoryId,
        ),
      )
      .returning({
        id: category.id,
      });

    if (!deleted.length) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json({
      message:
        "Category deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to delete category",
    });
  }
}