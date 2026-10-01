import { Router } from "express";
import { setup, signIn, verify } from "../controllers/auth.controller.js";

const router = Router();

router.post("/setup", setup);
router.post("/signin", signIn);
router.get("/verify", verify);

export default router;
