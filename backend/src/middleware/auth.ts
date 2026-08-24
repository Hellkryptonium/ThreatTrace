import type { NextFunction, Request, Response } from "express";

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  if (!request.session.userId) return response.status(401).json({ error: "Authentication required." });
  return next();
}