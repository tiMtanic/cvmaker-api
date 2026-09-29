import { Router } from "express";
import {
  getDocumentFile,
  getDocuments,
} from "../controllers/document.controller.js";

const router = Router();
router.get("/", getDocuments);
router.get("/:id/file", getDocumentFile);

export default router;
