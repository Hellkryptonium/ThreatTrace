import { Router } from "express";
import { InvestigationModel } from "../models/Investigation.js";
import { requireAuth } from "../middleware/auth.js";

export const investigationRouter = Router();

investigationRouter.get("/:id", requireAuth, async (request, response, next) => {
  try {
    const investigation = await InvestigationModel.findOne({ _id: request.params.id, userId: request.session.userId }).populate("emailId analysisId").lean();
    if (!investigation) return response.status(404).json({ error: "Investigation not found." });
    return response.json(investigation);
  } catch (error) {
    return next(error);
  }
});