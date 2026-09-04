import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getInvestigation } from "../controllers/investigation.controller.js";

export const investigationRouter = Router();

investigationRouter.get("/:id", requireAuth, asyncHandler(getInvestigation));