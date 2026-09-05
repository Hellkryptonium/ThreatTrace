import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { deleteInvestigations, exportInvestigations, getInvestigation, listInvestigations } from "../controllers/investigation.controller.js";

export const investigationRouter = Router();

investigationRouter.get("/", requireAuth, asyncHandler(listInvestigations));
investigationRouter.post("/export", requireAuth, asyncHandler(exportInvestigations));
investigationRouter.delete("/bulk", requireAuth, asyncHandler(deleteInvestigations));
investigationRouter.get("/:id", requireAuth, asyncHandler(getInvestigation));
