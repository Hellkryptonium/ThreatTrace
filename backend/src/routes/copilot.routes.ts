import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { chat } from "../controllers/copilot.controller.js";

export const copilotRouter = Router();
copilotRouter.post("/chat", requireAuth, asyncHandler(chat));
