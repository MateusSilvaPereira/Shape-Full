import { apiClient } from "@/lib/apiClient";
import type { Exercise, ExerciseFormValues } from "./types";

export function listExercises(search?: string, signal?: AbortSignal) {
  return apiClient
    .get<Exercise[]>("/exercises", { params: search ? { search } : {}, signal })
    .then((res) => res.data);
}

export function createExercise(input: ExerciseFormValues, signal?: AbortSignal) {
  return apiClient
    .post<Exercise>("/exercises", input, { signal })
    .then((res) => res.data);
}

export function updateExercise(
  id: string,
  input: Partial<ExerciseFormValues>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<Exercise>(`/exercises/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deleteExercise(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/exercises/${id}`, { signal })
    .then((res) => res.data);
}

export function uploadExerciseImage(id: string, file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient
    .post<Exercise>(`/exercises/${id}/image`, formData, { signal })
    .then((res) => res.data);
}
