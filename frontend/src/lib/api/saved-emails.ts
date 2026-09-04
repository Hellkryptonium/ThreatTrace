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
}

export function listSavedEmails() { return apiRequest<SavedEmail[]>("/api/v1/emails/saved"); }
export function getSavedEmailRaw(id: string) { return apiRequest<{ url: string }>(`/api/v1/emails/saved/${encodeURIComponent(id)}/raw`); }
export function deleteSavedEmail(id: string) { return apiRequest<void>(`/api/v1/emails/saved/${encodeURIComponent(id)}`, { method: "DELETE" }); }
