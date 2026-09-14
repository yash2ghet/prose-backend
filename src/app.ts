import express from "express";
import cors from "cors";

import {
  toNodeHandler,
  fromNodeHeaders,
} from "better-auth/node";

import { auth } from "../lib/auth";

import articleRoutes from "./routes/article.routes";
import categoryRoutes from "./routes/category.routes";
import tagRoutes from "./routes/tag.routes";
import profileRoutes from "./routes/profile.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { env } from "./config/env";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL, // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.all(
  "/api/auth/*splat",
  toNodeHandler(auth),
);

app.use(
  "/api/articles",
  articleRoutes,
);

app.use(
  "/api/categories",
  categoryRoutes,
);

app.use(
  "/api/tags",
  tagRoutes,
);

app.use(
  "/api/profile",
  profileRoutes,
);

app.use(
  "/api/dashboard",
  dashboardRoutes,
);

app.get("/", (_req, res) => {
  res.json({
    message: "Backend API is running",
  });
});

app.get(
  "/api/me",
  async (req, res) => {
    try {
      const session =
        await auth.api.getSession({
          headers:
            fromNodeHeaders(
              req.headers,
            ),
        });

      if (!session) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      return res.json(session);
    } catch (error) {
      console.error(
        "Session validation error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to validate session",
      });
    }
  },
);

export default app;