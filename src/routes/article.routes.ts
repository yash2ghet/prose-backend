import { Router } from "express";

import {
  createArticle,
  deleteArticle,
  duplicateArticle,
  getArticle,
  getArticleBySlug,
  getArticles,
  updateArticle,
} from "../controllers/article.controller";

import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", getArticles);

router.get(
  "/slug/:slug",
  getArticleBySlug,
);

router.get("/:id", getArticle);

router.post(
  "/",
  requireAuth,
  createArticle,
);

router.patch(
  "/:id",
  requireAuth,
  updateArticle,
);

router.delete(
  "/:id",
  requireAuth,
  deleteArticle,
);

router.post(
  "/:id/duplicate",
  requireAuth,
  duplicateArticle,
);

export default router;