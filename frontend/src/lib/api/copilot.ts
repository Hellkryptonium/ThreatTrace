import { apiRequest } from "./client";

export interface CopilotCitation { emailId?: string; investigationId?: string; label: string; }
export interface CopilotResponse { conversationId: string; message: string; citations: CopilotCitation[]; }

export function sendCopilotMessage(message: string, conversationId?: string, investigationId?: string) {
  return apiRequest<CopilotResponse>("/api/v1/copilot/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversationId, investigationId }) });
}
