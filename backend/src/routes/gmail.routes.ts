import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { analyzeGmailMessage, completeGmailConnection, connectGmail, getGmailConnectionStatus, getGmailMessages } from "../controllers/gmail.controller.js";

export const gmailRouter = Router();
gmailRouter.use(requireAuth);
gmailRouter.get("/connect", connectGmail);
gmailRouter.get("/callback", asyncHandler(completeGmailConnection));
gmailRouter.get("/status", asyncHandler(getGmailConnectionStatus));
gmailRouter.get("/messages", asyncHandler(getGmailMessages));
gmailRouter.post("/messages/:messageId/analyze", asyncHandler(analyzeGmailMessage));
