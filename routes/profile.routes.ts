import { Router } from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/profile.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, requireAdmin, updateProfile);

export default router;
