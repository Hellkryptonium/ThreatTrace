import { apiRequest } from "./client";

export interface CurrentUser { email: string; name: string; avatarUrl?: string; }

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/api/v1/auth/me");
}

export function googleLoginUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/auth/google`;
}

export function logoutUser() {
  return apiRequest("/api/v1/auth/logout", { method: "POST" });
}