import { apiClient } from "@/lib/apiClient";
import type { TrainingProgram, TrainingProgramFormValues } from "./types";

export function listTrainingPrograms(search?: string, signal?: AbortSignal) {
  return apiClient
    .get<TrainingProgram[]>("/training-programs", {
      params: search ? { search } : {},
      signal,
    })
    .then((res) => res.data);
}

export function createTrainingProgram(
  input: TrainingProgramFormValues,
  signal?: AbortSignal,
) {
  return apiClient
    .post<TrainingProgram>("/training-programs", input, { signal })
    .then((res) => res.data);
}

export function updateTrainingProgram(
  id: string,
  input: Partial<TrainingProgramFormValues>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<TrainingProgram>(`/training-programs/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deleteTrainingProgram(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/training-programs/${id}`, { signal })
    .then((res) => res.data);
}

export function listMyTrainingPrograms(signal?: AbortSignal) {
  return apiClient
    .get<TrainingProgram[]>("/training-programs/me", { signal })
    .then((res) => res.data);
}
