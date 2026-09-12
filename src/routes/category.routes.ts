import { Router } from "express";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller";

import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", getCategories);

router.get("/:id", getCategory);

router.post(
  "/",
  requireAuth,
  createCategory,
);

router.patch(
  "/:id",
  requireAuth,
  updateCategory,
);

router.delete(
  "/:id",
  requireAuth,
  deleteCategory,
);

export default router;