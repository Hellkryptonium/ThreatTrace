import cors from "cors";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "./config/env.js";
import { emailRouter } from "./routes/email.routes.js";
import { investigationRouter } from "./routes/investigation.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { gmailRouter } from "./routes/gmail.routes.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(session({ secret: env.SESSION_SECRET, store: MongoStore.create({ mongoUrl: env.MONGODB_URI, collectionName: "sessions" }), resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 7 } }));
  app.use(express.json());
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/gmail", gmailRouter);
  app.use("/api/v1/emails", emailRouter);
  app.use("/api/v1/investigations", investigationRouter);
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    response.status(500).json({ error: message });
  });
  return app;
}