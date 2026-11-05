import { apiClient } from "@/lib/apiClient";
import type {
  CreateProfessionalResult,
  Professional,
  ProfessionalFormValues,
} from "./types";

export function listProfessionals(search?: string, signal?: AbortSignal) {
  return apiClient
    .get<Professional[]>("/professionals", {
      params: search ? { search } : {},
      signal,
    })
    .then((res) => res.data);
}

export function createProfessional(
  input: ProfessionalFormValues,
  signal?: AbortSignal,
) {
  return apiClient
    .post<CreateProfessionalResult>("/professionals", input, { signal })
    .then((res) => res.data);
}

export function updateProfessional(
  id: string,
  input: Partial<Omit<ProfessionalFormValues, "email">>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<Professional>(`/professionals/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deactivateProfessional(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/professionals/${id}`, { signal })
    .then((res) => res.data);
}

export function uploadProfessionalAvatar(
  id: string,
  file: File,
  signal?: AbortSignal,
) {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiClient
    .post<Professional>(`/professionals/${id}/avatar`, formData, { signal })
    .then((res) => res.data);
}
