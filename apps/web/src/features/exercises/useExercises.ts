import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as exercisesApi from "./api";
import type { ExerciseFormValues } from "./types";

export function useExercises(search?: string) {
  return useQuery({
    queryKey: ["exercises", search ?? ""],
    queryFn: ({ signal }) => exercisesApi.listExercises(search, signal),
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: ExerciseFormValues & { signal?: AbortSignal }) =>
      exercisesApi.createExercise(input, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<ExerciseFormValues>;
      signal?: AbortSignal;
    }) => exercisesApi.updateExercise(id, input, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      exercisesApi.deleteExercise(id, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useUploadExerciseImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      signal,
    }: {
      id: string;
      file: File;
      signal?: AbortSignal;
    }) => exercisesApi.uploadExerciseImage(id, file, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}
