import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { emailUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadEmail } from "../controllers/email.controller.js";

export const emailRouter = Router();

emailRouter.post("/upload", requireAuth, emailUpload.single("file"), asyncHandler(uploadEmail));