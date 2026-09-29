import { Router } from "express";
import { getWorkExperience } from "../controllers/work-experience.controller.js";

const router = Router();
router.get("/", getWorkExperience);

export default router;
