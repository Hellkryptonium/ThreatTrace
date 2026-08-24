import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/threattrace"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  GMAIL_CALLBACK_URL: z.string().url().default("http://localhost:4000/api/v1/gmail/callback"),
  SESSION_SECRET: z.string().min(32),
  GMAIL_TOKEN_ENCRYPTION_KEY: z.string().min(32).default(process.env.SESSION_SECRET ?? ""),
  VIRUSTOTAL_API_KEY: z.string().optional(),
  URLSCAN_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);