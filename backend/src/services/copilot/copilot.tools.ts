import mongoose from "mongoose";
import { AnalysisModel } from "../../models/Analysis.js";
import { EmailModel } from "../../models/Email.js";
import { InvestigationModel } from "../../models/Investigation.js";
import { listGmailMessages } from "../gmail/gmail.service.js";
import { listOutlookMessages } from "../outlook/outlook.service.js";
import type { NormalizedEmail } from "../../types/email.js";

const limitOf = (value: unknown, fallback = 10, maximum = 25) => Math.max(1, Math.min(maximum, typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback));
const validId = (value: unknown): value is string => typeof value === "string" && mongoose.isValidObjectId(value);

function emailSummary(email: { _id: mongoose.Types.ObjectId; subject: string; sender: { name?: string; email: string }; date?: Date; source: string; urls?: string[]; attachments?: { filename: string }[] }) {
  return { id: email._id.toString(), subject: email.subject, sender: email.sender, timestamp: email.date, source: email.source, urlCount: email.urls?.length ?? 0, attachmentNames: email.attachments?.map((attachment) => attachment.filename) ?? [] };
}

export const toolDeclarations = [
  { name: "get_recent_emails", description: "List recent emails. Without a provider, use the user's saved ThreatTrace emails.", parameters: { type: "object", properties: { provider: { type: "string", enum: ["gmail", "outlook", "saved"] }, limit: { type: "integer", minimum: 1, maximum: 25 } } } },
  { name: "search_emails", description: "Search the user's saved emails by subject, sender, or source.", parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 25 } }, required: ["query"] } },
  { name: "get_email", description: "Get a sanitized normalized email by its ThreatTrace saved email ID.", parameters: { type: "object", properties: { emailId: { type: "string" } }, required: ["emailId"] } },
  { name: "analyze_email", description: "Return the existing ThreatTrace security analysis for a saved email, or create one when possible.", parameters: { type: "object", properties: { emailId: { type: "string" } }, required: ["emailId"] } },
  { name: "analyze_emails", description: "Return analyses for several saved emails in one operation.", parameters: { type: "object", properties: { emailIds: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 25 } }, required: ["emailIds"] } },
  { name: "analyze_url", description: "Return known ThreatTrace reputation evidence for a URL found in a saved email.", parameters: { type: "object", properties: { emailId: { type: "string" }, url: { type: "string" } }, required: ["emailId", "url"] } },
];

async function savedEmail(userId: string, emailId: unknown) {
  if (!validId(emailId)) return undefined;
  return EmailModel.findOne({ _id: emailId, userId }).lean();
}

async function existingAnalysis(userId: string, emailId: string) {
  const investigation = await InvestigationModel.findOne({ userId, emailId }).sort({ createdAt: -1 }).lean();
  if (!investigation) return undefined;
  const analysis = await AnalysisModel.findById(investigation.analysisId).lean();
  return analysis ? { investigationId: investigation._id.toString(), analysis } : undefined;
}

function analysisResult(value: NonNullable<Awaited<ReturnType<typeof existingAnalysis>>>) {
  const analysis = value.analysis;
  return { investigationId: value.investigationId, riskScore: analysis.riskScore, verdict: analysis.verdict, confidence: analysis.confidence, findings: analysis.findings, authentication: analysis.authentication, urlIntelligence: analysis.urlIntelligence, enrichment: analysis.enrichment, mlAssistance: analysis.mlAssistance, recommendedAction: analysis.analystVerdict?.recommendedAction };
}

export async function executeTool(userId: string, name: string, args: Record<string, unknown>) {
  if (name === "get_recent_emails") {
    const provider = args.provider;
    const limit = limitOf(args.limit);
    if (provider === "gmail") return (await listGmailMessages(userId)).slice(0, limit);
    if (provider === "outlook") return (await listOutlookMessages(userId)).slice(0, limit);
    const emails = await EmailModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).select("subject sender date source urls attachments").lean();
    return emails.map(emailSummary);
  }
  if (name === "search_emails") {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) return { error: "A search query is required." };
    const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const emails = await EmailModel.find({ userId, $or: [{ subject: expression }, { "sender.email": expression }, { "sender.name": expression }, { source: expression }] }).sort({ createdAt: -1 }).limit(limitOf(args.limit, 20)).select("subject sender date source urls attachments").lean();
    return emails.map(emailSummary);
  }
  if (name === "get_email") {
    const email = await savedEmail(userId, args.emailId);
    if (!email) return { error: "Saved email not found." };
    return { ...email, _id: email._id.toString(), cloudinary: undefined };
  }
  if (name === "analyze_email") {
    if (!validId(args.emailId)) return { error: "A valid saved email ID is required." };
    const result = await existingAnalysis(userId, args.emailId);
    return result ? analysisResult(result) : { error: "No analysis exists for this email yet. Open it from the mailbox and analyze it first." };
  }
  if (name === "analyze_emails") {
    const emailIds = Array.isArray(args.emailIds) ? args.emailIds.filter(validId).slice(0, 25) : [];
    const results = await Promise.all(emailIds.map(async (emailId) => { const result = await existingAnalysis(userId, emailId); return { emailId, ...(result ? analysisResult(result) : { error: "No existing analysis." }) }; }));
    return { results };
  }
  if (name === "analyze_url") {
    if (!validId(args.emailId) || typeof args.url !== "string") return { error: "A valid email ID and URL are required." };
    const email = await savedEmail(userId, args.emailId);
    const result = email ? await existingAnalysis(userId, args.emailId) : undefined;
    if (!email || !email.urls.includes(args.url)) return { error: "That URL was not found in the user's saved email." };
    const reputation = result?.analysis.enrichment?.urls?.filter((item) => item.url === args.url) ?? [];
    return { url: args.url, evidence: reputation, message: reputation.length ? "Known provider evidence returned." : "No stored provider evidence is available for this URL." };
  }
  return { error: `Unknown tool: ${name}` };
}

export type CopilotToolEmail = Pick<NormalizedEmail, "subject" | "sender" | "date" | "source">;
