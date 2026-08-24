import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
export const authRouter = Router();

authRouter.get("/google", (_request, response) => {
  const url = googleClient.generateAuthUrl({ access_type: "offline", scope: ["openid", "email", "profile"], prompt: "select_account" });
  response.redirect(url);
});

authRouter.get("/google/callback", async (request, response, next) => {
  try {
    const code = typeof request.query.code === "string" ? request.query.code : undefined;
    if (!code) return response.status(400).send("Missing Google authorization code.");
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token!, audience: env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email) return response.status(400).send("Google did not return a usable profile.");
    const user = await UserModel.findOneAndUpdate({ googleId: profile.sub }, { googleId: profile.sub, email: profile.email, name: profile.name ?? profile.email, avatarUrl: profile.picture }, { upsert: true, new: true, setDefaultsOnInsert: true });
    request.session.userId = user._id.toString();
    return response.redirect(`${env.FRONTEND_ORIGIN}/analyze/upload`);
  } catch (error) { return next(error); }
});

authRouter.get("/me", async (request, response) => {
  if (!request.session.userId) return response.status(401).json({ error: "Authentication required." });
  const user = await UserModel.findById(request.session.userId).select("email name avatarUrl").lean();
  if (!user) return response.status(401).json({ error: "Authentication required." });
  return response.json(user);
});

authRouter.post("/logout", (request, response, next) => request.session.destroy((error) => { if (error) return next(error); response.clearCookie("connect.sid"); return response.status(204).send(); }));