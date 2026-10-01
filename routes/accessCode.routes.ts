import { Router } from "express";
import {
  createAccessCode,
  deleteAccessCode,
  getAccessCodes,
} from "../controllers/accessCode.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", getAccessCodes);
router.post("/", createAccessCode);
router.delete("/:code", deleteAccessCode);

export default router;
