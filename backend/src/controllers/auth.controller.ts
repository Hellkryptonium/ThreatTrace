import { OAuth2Client } from "google-auth-library";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);

export function startGoogleLogin(_request: Request, response: Response) {
  const url = googleClient.generateAuthUrl({ access_type: "offline", scope: ["openid", "email", "profile"], prompt: "select_account" });
  return response.redirect(url);
}

export async function completeGoogleLogin(request: Request, response: Response) {
  const code = typeof request.query.code === "string" ? request.query.code : undefined;
  if (!code) return response.status(400).send("Missing Google authorization code.");
  const { tokens } = await googleClient.getToken(code);
  const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token!, audience: env.GOOGLE_CLIENT_ID });
  const profile = ticket.getPayload();
  if (!profile?.sub || !profile.email) return response.status(400).send("Google did not return a usable profile.");
  const user = await UserModel.findOneAndUpdate({ googleId: profile.sub }, { googleId: profile.sub, email: profile.email, name: profile.name ?? profile.email, avatarUrl: profile.picture }, { upsert: true, new: true, setDefaultsOnInsert: true });
  request.session.userId = user._id.toString();
  return response.redirect(`${env.FRONTEND_ORIGIN}/analyze/upload`);
}

export async function getCurrentUser(request: Request, response: Response) {
  if (!request.session.userId) return response.status(401).json({ error: "Authentication required." });
  const user = await UserModel.findById(request.session.userId).select("email name avatarUrl").lean();
  if (!user) return response.status(401).json({ error: "Authentication required." });
  return response.json(user);
}

export function logout(request: Request, response: Response, next: (error?: unknown) => void) {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie("connect.sid");
    return response.status(204).send();
  });
}
