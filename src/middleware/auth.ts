import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../../lib/auth";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = session.user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
};