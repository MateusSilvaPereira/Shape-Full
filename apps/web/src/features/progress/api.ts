import { apiClient } from "@/lib/apiClient";
import type { ProgressEntry, ProgressFormValues } from "./types";

export function listProgressByStudent(studentId: string, signal?: AbortSignal) {
  return apiClient
    .get<ProgressEntry[]>("/progress", { params: { studentId }, signal })
    .then((res) => res.data);
}

export function createProgress(input: ProgressFormValues, signal?: AbortSignal) {
  return apiClient
    .post<ProgressEntry>("/progress", input, { signal })
    .then((res) => res.data);
}

export function updateProgress(
  id: string,
  input: Partial<Omit<ProgressFormValues, "studentId">>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<ProgressEntry>(`/progress/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deleteProgress(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/progress/${id}`, { signal })
    .then((res) => res.data);
}
