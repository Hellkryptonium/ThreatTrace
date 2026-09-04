import { apiRequest } from "./client";

export interface CurrentUser { id?: string; email: string; name: string; username?: string; avatarUrl?: string; emailVerified?: boolean; googleId?: string; microsoftId?: string; }

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/api/v1/auth/me");
}

export function googleLoginUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/auth/google`;
}

export function microsoftLoginUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/auth/microsoft`;
}

export function logout() {
  return apiRequest<void>("/api/v1/auth/logout", { method: "POST" });
}

export function registerAccount(input: { name: string; email: string; username: string; password: string }) {
  return apiRequest<{ id: string; email: string; name: string; username: string }>("/api/v1/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export function loginAccount(input: { identifier: string; password: string }) {
  return apiRequest<{ id: string; email: string; name: string; username: string }>("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export function updateProfile(input: { name?: string; username?: string }) {
  return apiRequest<CurrentUser>("/api/v1/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export function updateAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiRequest<CurrentUser>("/api/v1/auth/profile/avatar", { method: "PATCH", body: formData });
}