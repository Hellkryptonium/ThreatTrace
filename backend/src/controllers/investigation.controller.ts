import type { Request, Response } from "express";
import { InvestigationModel } from "../models/Investigation.js";

export async function getInvestigation(request: Request, response: Response) {
  const investigation = await InvestigationModel.findOne({ _id: request.params.id, userId: request.session.userId }).populate("emailId analysisId").lean();
  if (!investigation) return response.status(404).json({ error: "Investigation not found." });
  return response.json(investigation);
}
