import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { emailUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";
import { deleteSavedEmail, getSavedEmail, getSavedEmailRaw, listSavedEmails, uploadEmail } from "../controllers/email.controller.js";

export const emailRouter = Router();

emailRouter.post("/upload", requireAuth, emailUpload.single("file"), asyncHandler(uploadEmail));
emailRouter.get("/", requireAuth, asyncHandler(listSavedEmails));
emailRouter.get("/:id", requireAuth, asyncHandler(getSavedEmail));
emailRouter.get("/:id/raw", requireAuth, asyncHandler(getSavedEmailRaw));
emailRouter.delete("/:id", requireAuth, asyncHandler(deleteSavedEmail));