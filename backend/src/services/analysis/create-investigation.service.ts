import { AnalysisModel } from "../../models/Analysis.js";
import { EmailModel } from "../../models/Email.js";
import { InvestigationModel } from "../../models/Investigation.js";
import { analyzeEmail } from "./analyze-email.js";
import { enrichEmail } from "../enrichment/enrichment.service.js";
import { inferMlAssistance } from "../ml/ml.service.js";
import { analyzePayloads } from "./payload/payload-analyzer.service.js";
import type { NormalizedEmail } from "../../types/email.js";
import { analyzeRoute } from "./route-forensics.js";

export async function createInvestigation(normalized: NormalizedEmail, userId: string, source: "EML" | "GMAIL" | "OUTLOOK" = "EML", providerMessageId?: string, cloudinary?: { publicId: string; secureUrl: string; resourceType: string }) {
  const analysis = analyzeEmail({ ...normalized, source });
  const route = analyzeRoute({ ...normalized, source });
  analysis.enrichment = await enrichEmail({ ...normalized, source }, analysis.probableOriginIp, route.relayPath.flatMap((hop) => hop.ipAddresses));
  analysis.mlAssistance = await inferMlAssistance({ ...normalized, source }, analysis);

  // ── Payload Analysis ──
  const payloadResult = await analyzePayloads(normalized.rawAttachments);
  analysis.payloadAnalysis = payloadResult.payloadAnalysis;

  // Merge payload findings into the evidence engine
  if (payloadResult.findings.length > 0) {
    analysis.findings.push(...payloadResult.findings);
    // Recalculate risk score with payload contributions
    const newScore = Math.min(100, analysis.findings.reduce((total, f) => total + f.scoreContribution, 0));
    analysis.riskScore = newScore;
    // Update verdict based on new score
    analysis.verdict = newScore >= 80 ? "CRITICAL" : newScore >= 60 ? "HIGH" : newScore >= 30 ? "MEDIUM" : newScore > 0 ? "LOW" : normalized.forwarded ? "INCONCLUSIVE" : "SAFE";
  }

  // Feed extracted URLs from payloads into entities
  if (payloadResult.extractedUrls.length > 0) {
    const existingUrls = new Set(analysis.entities.urls);
    for (const url of payloadResult.extractedUrls) existingUrls.add(url);
    analysis.entities.urls = [...existingUrls];
  }

  // Update malware classification if any payload is malicious
  if (payloadResult.payloadAnalysis.some((p) => p.verdict === "MALICIOUS")) {
    analysis.classification.malware = Math.max(analysis.classification.malware, 0.85);
  } else if (payloadResult.payloadAnalysis.some((p) => p.verdict === "SUSPICIOUS")) {
    analysis.classification.malware = Math.max(analysis.classification.malware, 0.45);
  }

  // Strip raw Buffer data before persisting (not serializable to MongoDB)
  const emailData = { ...normalized, source, userId, rawAttachments: undefined, ...(source === "GMAIL" && providerMessageId ? { gmailMessageId: providerMessageId } : {}), ...(source === "OUTLOOK" && providerMessageId ? { outlookMessageId: providerMessageId } : {}), ...(cloudinary ? { cloudinary } : {}) };
  const email = await EmailModel.create(emailData);
  const analysisDocument = await AnalysisModel.create({ ...analysis, emailId: email._id });
  const investigation = await InvestigationModel.create({
    userId,
    emailId: email._id,
    analysisId: analysisDocument._id,
    status: "COMPLETED",
    summary: `${analysis.verdict} email with a risk score of ${analysis.riskScore}/100.`,
  });
  return { id: investigation._id.toString(), emailId: email._id.toString(), status: "COMPLETED", analysis };
}
