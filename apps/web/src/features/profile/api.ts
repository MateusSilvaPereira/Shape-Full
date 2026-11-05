import { apiClient } from "@/lib/apiClient";
import type { AuthenticatedUser } from "@fitness360/shared";

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function updateProfile(input: UpdateProfileInput, signal?: AbortSignal) {
  return apiClient
    .patch<AuthenticatedUser>("/users/me", input, { signal })
    .then((res) => res.data);
}

export function changePassword(
  input: ChangePasswordInput,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<{ success: true }>("/users/me/password", input, { signal })
    .then((res) => res.data);
}

export function uploadAvatar(file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiClient
    .post<AuthenticatedUser>("/users/me/avatar", formData, { signal })
    .then((res) => res.data);
}
