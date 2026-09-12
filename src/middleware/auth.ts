import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../../lib/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    res.locals.session = session;
    res.locals.user = session.user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}