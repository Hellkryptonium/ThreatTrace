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

export interface InvestigationHistoryItem {
  id: string;
  emailId: string;
  subject: string;
  sender: { name?: string; email: string };
  source: "EML" | "GMAIL" | "OUTLOOK";
  date?: string;
  createdAt: string;
  summary?: string;
  status: "COMPLETED" | "FAILED";
  verdict: string;
  riskScore: number;
  confidence?: number;
}
export interface InvestigationHistoryPage { items: InvestigationHistoryItem[]; page: number; pageSize: number; total: number; totalPages: number; }
export interface InvestigationHistoryFilters { page?: number; pageSize?: number; search?: string; verdict?: string; provider?: string; dateFrom?: string; dateTo?: string; minRisk?: string; maxRisk?: string; sort?: string; }

export function listInvestigations(filters: InvestigationHistoryFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
  return apiRequest<InvestigationHistoryPage>(`/api/v1/investigations?${params.toString()}`);
}
export function exportInvestigations(ids: string[]) { return apiRequest<unknown>("/api/v1/investigations/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }); }
export function deleteInvestigations(ids: string[]) { return apiRequest<void>("/api/v1/investigations/bulk", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }); }
