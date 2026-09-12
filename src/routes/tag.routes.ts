import { Router } from "express";

import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
} from "../controllers/tag.controller";

import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", getTags);

router.post(
  "/",
  requireAuth,
  createTag,
);

router.patch(
  "/:id",
  requireAuth,
  updateTag,
);

router.delete(
  "/:id",
  requireAuth,
  deleteTag,
);

export default router;