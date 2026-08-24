import { google } from "googleapis";
import { env } from "../../config/env.js";
import { GmailAccountModel } from "../../models/GmailAccount.js";
import { decryptSecret, encryptSecret } from "../../utils/secrets.js";
import type { NormalizedEmail } from "../../types/email.js";
import { parseEml } from "../email/parse-eml.js";

export function createGoogleClient() { return new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GMAIL_CALLBACK_URL); }

export async function getGmailProfile(client: InstanceType<typeof google.auth.OAuth2>) {
  const gmail = google.gmail({ version: "v1", auth: client });
  const result = await gmail.users.getProfile({ userId: "me" });
  return { emailAddress: result.data.emailAddress };
}

export async function saveGmailAccount(userId: string, tokens: { refresh_token?: string | null; scope?: string | null }, profile: { sub: string; email: string }) {
  const existing = await GmailAccountModel.findOne({ userId });
  if (!tokens.refresh_token && !existing?.refreshToken) throw new Error("Google did not return a refresh token for the first Gmail connection.");
  await GmailAccountModel.findOneAndUpdate({ userId }, {
    userId,
    googleAccountId: profile.sub,
    email: profile.email,
    refreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : existing?.refreshToken,
    scopes: tokens.scope?.split(" ") ?? existing?.scopes ?? [],
  }, { upsert: true, new: true });
}

async function gmailForUser(userId: string) {
  const account = await GmailAccountModel.findOne({ userId });
  if (!account) throw new Error("Connect Gmail before requesting messages.");
  const client = createGoogleClient();
  client.setCredentials({ refresh_token: decryptSecret(account.refreshToken) });
  return google.gmail({ version: "v1", auth: client });
}

export async function getGmailStatus(userId: string) { const account = await GmailAccountModel.findOne({ userId }).select("email scopes updatedAt").lean(); return account ? { connected: true, email: account.email, scopes: account.scopes } : { connected: false }; }

export async function listGmailMessages(userId: string) {
  const gmail = await gmailForUser(userId);
  const result = await gmail.users.messages.list({ userId: "me", maxResults: 25, q: "-in:trash" });
  const messages = await Promise.all((result.data.messages ?? []).slice(0, 25).map(async (message) => {
    const detail = await gmail.users.messages.get({ userId: "me", id: message.id!, format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] });
    const headers = Object.fromEntries((detail.data.payload?.headers ?? []).map((header) => [header.name?.toLowerCase() ?? "", header.value ?? ""]));
    return { id: message.id, threadId: message.threadId, from: headers.from, to: headers.to, subject: headers.subject ?? "(no subject)", date: headers.date, snippet: detail.data.snippet };
  }));
  return messages;
}

export async function fetchGmailEmail(userId: string, messageId: string): Promise<NormalizedEmail> {
  const gmail = await gmailForUser(userId);
  const result = await gmail.users.messages.get({ userId: "me", id: messageId, format: "raw" });
  if (!result.data.raw) throw new Error("Gmail returned no message content.");
  return parseEml(Buffer.from(result.data.raw, "base64url"));
}