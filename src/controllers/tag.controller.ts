import type {
  Request,
  Response,
} from "express";

import {
  asc,
  eq,
} from "drizzle-orm";

import { db } from "../config/db";
import { tag } from "../db/schema";

function createId() {
  return crypto.randomUUID();
}

export async function getTags(
  _req: Request,
  res: Response,
) {
  try {
    const data = await db
      .select()
      .from(tag)
      .orderBy(asc(tag.name));

    return res.json({
      data,
    });
  } catch (error) {
    console.error(
      "Get tags error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch tags",
    });
  }
}

export async function createTag(
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
      .select({ id: tag.id })
      .from(tag)
      .where(
        eq(tag.slug, slug.trim()),
      )
      .limit(1);

    if (existing.length) {
      return res.status(409).json({
        message:
          "A tag with this slug already exists",
      });
    }

    const inserted = await db
      .insert(tag)
      .values({
        id: createId(),
        name: name.trim(),
        slug: slug.trim(),
      })
      .returning();

    return res.status(201).json({
      data: inserted[0],
    });
  } catch (error) {
    console.error(
      "Create tag error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to create tag",
    });
  }
}

export async function updateTag(
  req: Request,
  res: Response,
) {
  try {
    const { name, slug } =
      req.body;
    const tagId = req.params.id;

    if (Array.isArray(tagId)) {
      return res.status(400).json({
        message: "Invalid tag id",
      });
    }

    const updated = await db
      .update(tag)
      .set({
        ...(name !== undefined && {
          name: String(name).trim(),
        }),
        ...(slug !== undefined && {
          slug: String(slug).trim(),
        }),
        updatedAt: new Date(),
      })
      .where(
        eq(tag.id, tagId),
      )
      .returning();

    if (!updated.length) {
      return res.status(404).json({
        message: "Tag not found",
      });
    }

    return res.json({
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "Update tag error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to update tag",
    });
  }
}

export async function deleteTag(
  req: Request,
  res: Response,
) {
  try {
    const tagId = req.params.id;

    if (Array.isArray(tagId)) {
      return res.status(400).json({
        message: "Invalid tag id",
      });
    }

    const deleted = await db
      .delete(tag)
      .where(
        eq(tag.id, tagId),
      )
      .returning({
        id: tag.id,
      });

    if (!deleted.length) {
      return res.status(404).json({
        message: "Tag not found",
      });
    }

    return res.json({
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete tag error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to delete tag",
    });
  }
}