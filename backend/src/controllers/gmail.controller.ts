import crypto from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { createGoogleClient, fetchGmailEmail, getGmailProfile, getGmailStatus, listGmailMessages, saveGmailAccount } from "../services/gmail/gmail.service.js";
import { createInvestigation } from "../services/analysis/create-investigation.service.js";

export function connectGmail(request: Request, response: Response) {
  const state = crypto.randomUUID();
  request.session.gmailState = state;
  const client = createGoogleClient();
  const authorizationUrl = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: ["https://www.googleapis.com/auth/gmail.readonly"], state });
  request.session.save((error) => {
    if (error) return response.status(500).send("Unable to start Gmail authorization.");
    return response.redirect(authorizationUrl);
  });
}

export async function completeGmailConnection(request: Request, response: Response) {
  if (typeof request.query.state !== "string" || request.query.state !== request.session.gmailState) return response.status(400).send("Invalid OAuth state. Start Gmail connection again.");
  const code = typeof request.query.code === "string" ? request.query.code : undefined;
  if (!code) return response.status(400).send("Missing Gmail authorization code.");
  const client = createGoogleClient();
  let tokens;
  try { ({ tokens } = await client.getToken({ code, redirect_uri: env.GMAIL_CALLBACK_URL })); }
  catch { return response.status(400).send("Google rejected the Gmail authorization code. Confirm the registered redirect URI and start a new connection."); }
  client.setCredentials(tokens);
  const gmailProfile = await getGmailProfile(client);
  if (!gmailProfile.emailAddress) return response.status(400).send("Google authorization succeeded, but the Gmail account profile was incomplete.");
  await saveGmailAccount(request.session.userId!, tokens, { sub: gmailProfile.emailAddress, email: gmailProfile.emailAddress });
  delete request.session.gmailState;
  return response.redirect(`${env.FRONTEND_ORIGIN}/emails`);
}

export async function getGmailConnectionStatus(request: Request, response: Response) { return response.json(await getGmailStatus(request.session.userId!)); }

export async function getGmailMessages(request: Request, response: Response) {
  try { return response.json(await listGmailMessages(request.session.userId!)); }
  catch (error) {
    const gmailError = error as { response?: { data?: { error?: string } } };
    if (gmailError.response?.data?.error === "invalid_grant") return response.status(401).json({ error: "Gmail authorization expired. Reconnect Gmail." });
    throw error;
  }
}

export async function analyzeGmailMessage(request: Request, response: Response) {
  const messageId = typeof request.params.messageId === "string" ? request.params.messageId : undefined;
  if (!messageId) return response.status(400).json({ error: "A Gmail message ID is required." });
  const normalized = await fetchGmailEmail(request.session.userId!, messageId);
  const result = await createInvestigation(normalized, request.session.userId!, "GMAIL", messageId);
  return response.status(201).json(result);
}
