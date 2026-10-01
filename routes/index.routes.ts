import { Router } from "express";
import profileRouter from "./profile.routes.js";
import workExperienceRouter from "./work-experience.routes.js";
import educationRouter from "./education.routes.js";
import skillRouter from "./skill.routes.js";
import documentRouter from "./document.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();
router.use("/profile", profileRouter);
router.use("/work-experience", workExperienceRouter);
router.use("/education", educationRouter);
router.use("/skills", skillRouter);
router.use("/documents", documentRouter);
router.use("/auth", authRoutes);

export default router;
