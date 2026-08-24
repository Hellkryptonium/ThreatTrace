import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { createGoogleClient, fetchGmailEmail, getGmailProfile, getGmailStatus, listGmailMessages, saveGmailAccount } from "../services/gmail/gmail.service.js";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";
import { EmailModel } from "../models/Email.js";
import { AnalysisModel } from "../models/Analysis.js";
import { InvestigationModel } from "../models/Investigation.js";
import { analyzeEmail } from "../services/analysis/analyze-email.js";
import { enrichEmail } from "../services/enrichment/enrichment.service.js";

export const gmailRouter = Router();
gmailRouter.use(requireAuth);

gmailRouter.get("/connect", (request, response) => {
  const state = crypto.randomUUID();
  request.session.gmailState = state;
  const client = createGoogleClient();
  const authorizationUrl = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: ["https://www.googleapis.com/auth/gmail.readonly"], state });
  request.session.save((error) => {
    if (error) return response.status(500).send("Unable to start Gmail authorization.");
    return response.redirect(authorizationUrl);
  });
});

gmailRouter.get("/callback", async (request, response, next) => {
  try {
    if (typeof request.query.state !== "string" || request.query.state !== request.session.gmailState) return response.status(400).send("Invalid OAuth state. Start Gmail connection again.");
    const code = typeof request.query.code === "string" ? request.query.code : undefined;
    if (!code) return response.status(400).send("Missing Gmail authorization code.");
    const client = createGoogleClient();
    let tokens;
    try {
      ({ tokens } = await client.getToken({ code, redirect_uri: env.GMAIL_CALLBACK_URL }));
    } catch (error) {
      console.error("Gmail token exchange failed:", error);
      return response.status(400).send("Google rejected the Gmail authorization code. Confirm the registered redirect URI exactly matches http://localhost:4000/api/v1/gmail/callback, then start a new connection.");
    }
    client.setCredentials(tokens);
    let profile: { sub: string; email: string };
    try {
      const gmailProfile = await getGmailProfile(client);
      const user = await UserModel.findById(request.session.userId).select("googleId").lean();
      if (!user?.googleId || !gmailProfile.emailAddress) return response.status(400).send("Google authorization succeeded, but the Gmail account profile was incomplete.");
      profile = { sub: user.googleId, email: gmailProfile.emailAddress };
    } catch (error) {
      console.error("Gmail profile lookup failed:", error);
      return response.status(400).send("Google authorization succeeded, but the Gmail profile could not be read.");
    }
    try {
      await saveGmailAccount(request.session.userId!, tokens, profile);
    } catch (error) {
      console.error("Gmail token storage failed:", error);
      return response.status(500).send("Google authorization succeeded, but the Gmail connection could not be saved.");
    }
    delete request.session.gmailState;
    return response.redirect(`${env.FRONTEND_ORIGIN}/emails`);
  } catch (error) {
    const oauthError = error as { response?: { data?: { error?: string; error_description?: string } }; message?: string };
    console.error("Gmail OAuth callback failed:", oauthError.response?.data ?? oauthError.message ?? "unknown error");
    return next(new Error("Gmail authorization could not be completed. Verify the Google Cloud redirect URI and try again."));
  }
});

gmailRouter.get("/status", async (request, response, next) => { try { return response.json(await getGmailStatus(request.session.userId!)); } catch (error) { return next(error); } });
gmailRouter.get("/messages", async (request, response, next) => { try { return response.json(await listGmailMessages(request.session.userId!)); } catch (error) { return next(error); } });
gmailRouter.post("/messages/:messageId/analyze", async (request, response, next) => {
  try {
    const normalized = await fetchGmailEmail(request.session.userId!, request.params.messageId);
    const analysis = analyzeEmail({ ...normalized, source: "GMAIL" });
    analysis.enrichment = await enrichEmail({ ...normalized, source: "GMAIL" }, analysis.probableOriginIp);
    const email = await EmailModel.create({ ...normalized, source: "GMAIL", userId: request.session.userId, gmailMessageId: request.params.messageId });
    const analysisDocument = await AnalysisModel.create({ ...analysis, emailId: email._id });
    const investigation = await InvestigationModel.create({ userId: request.session.userId, emailId: email._id, analysisId: analysisDocument._id, status: "COMPLETED", summary: `${analysis.verdict} email with a risk score of ${analysis.riskScore}/100.` });
    return response.status(201).json({ id: investigation._id.toString(), status: "COMPLETED", analysis });
  } catch (error) { return next(error); }
});