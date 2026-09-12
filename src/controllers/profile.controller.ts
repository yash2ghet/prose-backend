import type {
  Request,
  Response,
} from "express";

import { eq } from "drizzle-orm";

import { db } from "../config/db";
import { user } from "../db/schema";

export async function getProfile(
  _req: Request,
  res: Response,
) {
  try {
    const currentUser =
      res.locals.user;

    return res.json({
      data: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
        emailVerified:
          currentUser.emailVerified,
        createdAt:
          currentUser.createdAt,
        updatedAt:
          currentUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch profile",
    });
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
) {
  try {
    const { name, image } =
      req.body;

    if (
      name !== undefined &&
      (
        typeof name !== "string" ||
        !name.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Name cannot be empty",
      });
    }

    const updated = await db
      .update(user)
      .set({
        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(image !== undefined && {
          image:
            image === null
              ? null
              : String(image),
        }),

        updatedAt: new Date(),
      })
      .where(
        eq(
          user.id,
          res.locals.user.id,
        ),
      )
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified:
          user.emailVerified,
        createdAt:
          user.createdAt,
        updatedAt:
          user.updatedAt,
      });

    return res.json({
      data: updated[0],
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to update profile",
    });
  }
}