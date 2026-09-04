import type { Request, Response } from "express";
import { parseEml } from "../services/email/parse-eml.js";
import { createInvestigation } from "../services/analysis/create-investigation.service.js";

export async function uploadEmail(request: Request, response: Response) {
  if (!request.file) return response.status(400).json({ error: "A valid .eml file is required." });
  const normalized = await parseEml(request.file.buffer);
  if (!normalized.sender.email) return response.status(422).json({ error: "The email has no usable sender address." });
  const result = await createInvestigation(normalized, request.session.userId!, "EML");
  return response.status(201).json(result);
}
