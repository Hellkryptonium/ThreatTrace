import { AnalysisModel } from "../../models/Analysis.js";
import { EmailModel } from "../../models/Email.js";
import { InvestigationModel } from "../../models/Investigation.js";
import { analyzeEmail } from "./analyze-email.js";
import { enrichEmail } from "../enrichment/enrichment.service.js";
import { inferMlAssistance } from "../ml/ml.service.js";
import type { NormalizedEmail } from "../../types/email.js";
import { analyzeRoute } from "./route-forensics.js";

export async function createInvestigation(normalized: NormalizedEmail, userId: string, source: "EML" | "GMAIL" | "OUTLOOK" = "EML", providerMessageId?: string, cloudinary?: { publicId: string; secureUrl: string; resourceType: string }) {
  const analysis = analyzeEmail({ ...normalized, source });
  const route = analyzeRoute({ ...normalized, source });
  analysis.enrichment = await enrichEmail({ ...normalized, source }, analysis.probableOriginIp, route.relayPath.flatMap((hop) => hop.ipAddresses));
  analysis.mlAssistance = await inferMlAssistance({ ...normalized, source }, analysis);
  const email = await EmailModel.create({ ...normalized, source, userId, ...(source === "GMAIL" && providerMessageId ? { gmailMessageId: providerMessageId } : {}), ...(source === "OUTLOOK" && providerMessageId ? { outlookMessageId: providerMessageId } : {}), ...(cloudinary ? { cloudinary } : {}) });
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
