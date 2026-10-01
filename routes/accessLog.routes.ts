import { Router } from "express";
import { getAccessLogs } from "../controllers/accessLog.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", getAccessLogs);

export default router;
