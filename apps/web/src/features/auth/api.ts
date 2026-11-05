import { apiClient } from "@/lib/apiClient";
import type { AcademyBranding, LoginResponse, SessionResponse } from "./types";

export function login(email: string, password: string, signal?: AbortSignal) {
  return apiClient
    .post<LoginResponse>("/auth/login", { email, password }, { signal })
    .then((res) => res.data);
}

export function fetchSession() {
  return apiClient.get<SessionResponse>("/auth/me").then((res) => res.data);
}

export function fetchAcademyBySlug(slug: string) {
  return apiClient
    .get<AcademyBranding>(`/academies/${slug}`)
    .then((res) => res.data);
}

export function forgotPassword(email: string, signal?: AbortSignal) {
  return apiClient
    .post<{ message: string }>("/auth/forgot-password", { email }, { signal })
    .then((res) => res.data);
}

export function resetPassword(token: string, newPassword: string, signal?: AbortSignal) {
  return apiClient
    .post<{ message: string }>("/auth/reset-password", { token, newPassword }, { signal })
    .then((res) => res.data);
}
