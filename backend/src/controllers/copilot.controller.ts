import type { Request, Response } from "express";
import { chatWithCopilot } from "../services/copilot/copilot.service.js";

export async function chat(request: Request, response: Response) {
  const body = request.body as { message?: unknown; conversationId?: unknown };
  if (typeof body.message !== "string" || !body.message.trim()) return response.status(400).json({ error: "A message is required." });
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;
  return response.json(await chatWithCopilot(request.session.userId!, body.message, conversationId));
}
