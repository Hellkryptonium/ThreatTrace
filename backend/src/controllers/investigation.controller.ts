import type { Request, Response } from "express";
import mongoose from "mongoose";
import { AnalysisModel } from "../models/Analysis.js";
import { EmailModel } from "../models/Email.js";
import { InvestigationModel } from "../models/Investigation.js";
import { deleteArchivedEmail } from "../services/storage/cloudinary.service.js";

const pageNumber = (value: unknown, fallback: number, maximum: number) => Math.max(1, Math.min(maximum, typeof value === "string" && /^\d+$/.test(value) ? Number(value) : fallback));
const boundedNumber = (value: unknown) => typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : undefined;

function queryValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

function bulkIds(value: unknown) {
  const ids = Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && mongoose.isValidObjectId(item)))] : [];
  return ids.length > 0 && ids.length <= 100 ? ids : undefined;
}

export async function listInvestigations(request: Request, response: Response) {
  const page = pageNumber(request.query.page, 1, 100000);
  const pageSize = pageNumber(request.query.pageSize, 20, 50);
  const search = queryValue(request.query.search);
  const verdict = queryValue(request.query.verdict);
  const provider = queryValue(request.query.provider);
  const dateFrom = queryValue(request.query.dateFrom);
  const dateTo = queryValue(request.query.dateTo);
  const minRisk = boundedNumber(request.query.minRisk);
  const maxRisk = boundedNumber(request.query.maxRisk);
  const sort = queryValue(request.query.sort);
  const direction: 1 | -1 = sort === "oldest" || sort === "riskLow" ? 1 : -1;
  const sortField = sort === "riskHigh" || sort === "riskLow" ? "analysis.riskScore" : sort === "emailDate" ? "email.date" : "createdAt";
  const emailMatch: Record<string, unknown> = {};
  const analysisMatch: Record<string, unknown> = {};
  if (search) {
    const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    emailMatch.$or = [{ "email.subject": expression }, { "email.sender.email": expression }, { "email.sender.name": expression }];
  }
  if (["EML", "GMAIL", "OUTLOOK"].includes(provider)) emailMatch["email.source"] = provider;
  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom && !Number.isNaN(Date.parse(dateFrom))) range.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
    if (dateTo && !Number.isNaN(Date.parse(dateTo))) range.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    if (Object.keys(range).length) emailMatch["email.date"] = range;
  }
  if (["SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(verdict)) analysisMatch["analysis.verdict"] = verdict;
  if (minRisk !== undefined || maxRisk !== undefined) analysisMatch["analysis.riskScore"] = { ...(minRisk !== undefined ? { $gte: minRisk } : {}), ...(maxRisk !== undefined ? { $lte: maxRisk } : {}) };
  const userId = new mongoose.Types.ObjectId(request.session.userId!);
  const pipeline: mongoose.PipelineStage[] = [
    { $match: { userId } },
    { $lookup: { from: "emails", localField: "emailId", foreignField: "_id", as: "email" } },
    { $unwind: "$email" },
    { $lookup: { from: "analyses", localField: "analysisId", foreignField: "_id", as: "analysis" } },
    { $unwind: "$analysis" },
    ...(Object.keys(emailMatch).length ? [{ $match: emailMatch }] : []),
    ...(Object.keys(analysisMatch).length ? [{ $match: analysisMatch }] : []),
    { $facet: {
      items: [
        { $sort: { [sortField]: direction, _id: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        { $project: { _id: 0, id: { $toString: "$_id" }, emailId: { $toString: "$email._id" }, subject: "$email.subject", sender: "$email.sender", source: "$email.source", date: "$email.date", createdAt: "$createdAt", summary: "$summary", status: "$status", verdict: "$analysis.verdict", riskScore: "$analysis.riskScore", confidence: "$analysis.confidence" } },
      ],
      metadata: [{ $count: "total" }],
    } },
  ];
  const [result] = await InvestigationModel.aggregate(pipeline);
  const total = result?.metadata?.[0]?.total ?? 0;
  return response.json({ items: result?.items ?? [], page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function getInvestigation(request: Request, response: Response) {
  const investigation = await InvestigationModel.findOne({ _id: request.params.id, userId: request.session.userId }).populate("emailId analysisId").lean();
  if (!investigation) return response.status(404).json({ error: "Investigation not found." });
  return response.json(investigation);
}

export async function exportInvestigations(request: Request, response: Response) {
  const ids = bulkIds((request.body as { ids?: unknown }).ids);
  if (!ids) return response.status(400).json({ error: "Provide between 1 and 100 investigation IDs." });
  const investigations = await InvestigationModel.find({ _id: { $in: ids }, userId: request.session.userId }).lean();
  if (investigations.length !== ids.length) return response.status(404).json({ error: "One or more investigations were not found." });
  const [emails, analyses] = await Promise.all([
    EmailModel.find({ _id: { $in: investigations.map((item) => item.emailId) }, userId: request.session.userId }).select("subject sender recipients date headers text html urls attachments replyTo returnPath source forwarded receivedHeaders").lean(),
    AnalysisModel.find({ _id: { $in: investigations.map((item) => item.analysisId) } }).lean(),
  ]);
  const emailById = new Map(emails.map((item) => [item._id.toString(), item]));
  const analysisById = new Map(analyses.map((item) => [item._id.toString(), item]));
  return response.json({ exportedAt: new Date().toISOString(), investigations: investigations.map((item) => ({ id: item._id.toString(), status: item.status, summary: item.summary, createdAt: item.createdAt, email: emailById.get(item.emailId.toString()), analysis: analysisById.get(item.analysisId.toString()) })) });
}

export async function deleteInvestigations(request: Request, response: Response) {
  const ids = bulkIds((request.body as { ids?: unknown }).ids);
  if (!ids) return response.status(400).json({ error: "Provide between 1 and 100 investigation IDs." });
  const investigations = await InvestigationModel.find({ _id: { $in: ids }, userId: request.session.userId }).lean();
  if (investigations.length !== ids.length) return response.status(404).json({ error: "One or more investigations were not found." });
  const emails = await EmailModel.find({ _id: { $in: investigations.map((item) => item.emailId) }, userId: request.session.userId }).select("cloudinary").lean();
  await Promise.all(emails.flatMap((email) => email.cloudinary?.publicId ? [deleteArchivedEmail(email.cloudinary.publicId)] : []));
  await Promise.all([
    InvestigationModel.deleteMany({ _id: { $in: ids }, userId: request.session.userId }),
    AnalysisModel.deleteMany({ _id: { $in: investigations.map((item) => item.analysisId) } }),
    EmailModel.deleteMany({ _id: { $in: investigations.map((item) => item.emailId) }, userId: request.session.userId }),
  ]);
  return response.status(204).send();
}
