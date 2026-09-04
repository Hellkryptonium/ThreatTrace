import type { Request, Response } from "express";
import mongoose from "mongoose";
import { parseEml } from "../services/email/parse-eml.js";
import { createInvestigation } from "../services/analysis/create-investigation.service.js";
import { archiveEmail } from "../services/storage/cloudinary.service.js";
import { deleteArchivedEmail, getPrivateEmailUrl } from "../services/storage/cloudinary.service.js";
import { EmailModel } from "../models/Email.js";
import { AnalysisModel } from "../models/Analysis.js";
import { InvestigationModel } from "../models/Investigation.js";

export async function uploadEmail(request: Request, response: Response) {
  if (!request.file) return response.status(400).json({ error: "A valid .eml file is required." });
  const normalized = await parseEml(request.file.buffer);
  if (!normalized.sender.email) return response.status(422).json({ error: "The email has no usable sender address." });
  const result = await createInvestigation(normalized, request.session.userId!, "EML");
  try {
    const cloudinary = await archiveEmail(request.file.buffer, request.session.userId!, result.emailId);
    if (cloudinary) await EmailModel.updateOne({ _id: result.emailId, userId: request.session.userId }, { $set: { cloudinary } });
  } catch (error) { console.warn("Cloudinary email archive failed; continuing analysis:", error instanceof Error ? error.message : error); }
  return response.status(201).json(result);
}

export async function listSavedEmails(request: Request, response: Response) {
  const emails = await EmailModel.find({ userId: request.session.userId }).sort({ createdAt: -1 }).select("subject sender date source cloudinary createdAt").lean();
  const investigations = await InvestigationModel.find({ userId: request.session.userId, emailId: { $in: emails.map((email) => email._id) } }).select("emailId analysisId summary status").lean();
  const analyses = await AnalysisModel.find({ _id: { $in: investigations.map((item) => item.analysisId) } }).select("emailId riskScore verdict").lean();
  const investigationByEmail = new Map(investigations.map((item) => [item.emailId.toString(), item]));
  const analysisByEmail = new Map(analyses.map((item) => [item.emailId.toString(), item]));
  return response.json(emails.map((email) => {
    const investigation = investigationByEmail.get(email._id.toString());
    const analysis = analysisByEmail.get(email._id.toString());
    return { id: email._id.toString(), subject: email.subject, sender: email.sender, date: email.date, source: email.source, createdAt: email.createdAt, hasRawFile: Boolean(email.cloudinary), investigationId: investigation?._id.toString(), summary: investigation?.summary, verdict: analysis?.verdict, riskScore: analysis?.riskScore };
  }));
}

export async function getSavedEmail(request: Request, response: Response) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Saved email not found." });
  const email = await EmailModel.findOne({ _id: request.params.id, userId: request.session.userId }).select("subject sender recipients date source createdAt text html urls attachments cloudinary").lean();
  if (!email) return response.status(404).json({ error: "Saved email not found." });
  const investigation = await InvestigationModel.findOne({ emailId: email._id, userId: request.session.userId }).select("_id summary status analysisId").lean();
  const analysis = investigation ? await AnalysisModel.findById(investigation.analysisId).select("riskScore verdict confidence").lean() : null;
  return response.json({ ...email, id: email._id.toString(), hasRawFile: Boolean(email.cloudinary), investigationId: investigation?._id.toString(), summary: investigation?.summary, riskScore: analysis?.riskScore, verdict: analysis?.verdict, confidence: analysis?.confidence });
}

export async function getSavedEmailRaw(request: Request, response: Response) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Saved email not found." });
  const email = await EmailModel.findOne({ _id: request.params.id, userId: request.session.userId }).select("cloudinary").lean();
  if (!email) return response.status(404).json({ error: "Saved email not found." });
  if (!email.cloudinary?.publicId) return response.status(404).json({ error: "Original email file is not available." });
  return response.json({ url: getPrivateEmailUrl(email.cloudinary.publicId) });
}

export async function deleteSavedEmail(request: Request, response: Response) {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Saved email not found." });
  const email = await EmailModel.findOneAndDelete({ _id: request.params.id, userId: request.session.userId });
  if (!email) return response.status(404).json({ error: "Saved email not found." });
  if (email.cloudinary?.publicId) await deleteArchivedEmail(email.cloudinary.publicId);
  await AnalysisModel.deleteOne({ emailId: email._id });
  await InvestigationModel.deleteMany({ emailId: email._id, userId: request.session.userId });
  return response.status(204).send();
}
