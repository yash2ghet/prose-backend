import { Router } from "express";

import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

export default router;