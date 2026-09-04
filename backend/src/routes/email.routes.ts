import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { emailUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";
import { deleteSavedEmail, getSavedEmailRaw, listSavedEmails, uploadEmail } from "../controllers/email.controller.js";

export const emailRouter = Router();

emailRouter.post("/upload", requireAuth, emailUpload.single("file"), asyncHandler(uploadEmail));
emailRouter.get("/saved", requireAuth, asyncHandler(listSavedEmails));
emailRouter.get("/saved/:id/raw", requireAuth, asyncHandler(getSavedEmailRaw));
emailRouter.delete("/saved/:id", requireAuth, asyncHandler(deleteSavedEmail));