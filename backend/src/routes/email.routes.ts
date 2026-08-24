import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { EmailModel } from "../models/Email.js";
import { AnalysisModel } from "../models/Analysis.js";
import { InvestigationModel } from "../models/Investigation.js";
import { analyzeEmail } from "../services/analysis/analyze-email.js";
import { parseEml } from "../services/email/parse-eml.js";
import { enrichEmail } from "../services/enrichment/enrichment.service.js";
import { requireAuth } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    const validExtension = file.originalname.toLowerCase().endsWith(".eml");
    const validMime = ["message/rfc822", "application/octet-stream", "text/plain"].includes(file.mimetype);
    callback(null, validExtension && validMime);
  },
});

export const emailRouter = Router();

emailRouter.post("/upload", requireAuth, upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ error: "A valid .eml file is required." });
    const normalized = await parseEml(request.file.buffer);
    if (!normalized.sender.email) return response.status(422).json({ error: "The email has no usable sender address." });
    const analysis = analyzeEmail(normalized);
    analysis.enrichment = await enrichEmail(normalized, analysis.probableOriginIp);
    const email = await EmailModel.create({ ...normalized, userId: request.session.userId });
    const analysisDocument = await AnalysisModel.create({ ...analysis, emailId: email._id });
    const investigation = await InvestigationModel.create({
      userId: request.session.userId,
      emailId: email._id,
      analysisId: analysisDocument._id,
      status: "COMPLETED",
      summary: `${analysis.verdict} email with a risk score of ${analysis.riskScore}/100.`,
    });
    return response.status(201).json({ id: investigation._id.toString(), status: "COMPLETED", analysis });
  } catch (error) {
    return next(error);
  }
});