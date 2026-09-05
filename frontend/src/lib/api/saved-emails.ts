import { apiRequest } from "./client";

export interface SavedEmail {
  id: string;
  subject: string;
  sender: { name?: string; email: string };
  date?: string;
  source: "EML" | "GMAIL" | "OUTLOOK";
  createdAt: string;
  hasRawFile: boolean;
  investigationId?: string;
  summary?: string;
  verdict?: string;
  riskScore?: number;
  confidence?: number;
}

export function listSavedEmails() { return apiRequest<SavedEmail[]>("/api/v1/emails"); }
export function getSavedEmail(id: string) { return apiRequest<SavedEmail>(`/api/v1/emails/${encodeURIComponent(id)}`); }
export function getSavedEmailRaw(id: string) { return apiRequest<{ url: string }>(`/api/v1/emails/${encodeURIComponent(id)}/raw`); }
export function deleteSavedEmail(id: string) { return apiRequest<void>(`/api/v1/emails/${encodeURIComponent(id)}`, { method: "DELETE" }); }
