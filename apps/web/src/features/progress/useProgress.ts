import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as progressApi from "./api";
import type { ProgressFormValues } from "./types";

export function useProgressEntries(studentId: string | null) {
  return useQuery({
    queryKey: ["progress", studentId],
    queryFn: ({ signal }) => progressApi.listProgressByStudent(studentId!, signal),
    enabled: Boolean(studentId),
  });
}

export function useCreateProgress(studentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: ProgressFormValues & { signal?: AbortSignal }) =>
      progressApi.createProgress(input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", studentId] });
    },
  });
}

export function useUpdateProgress(studentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<Omit<ProgressFormValues, "studentId">>;
      signal?: AbortSignal;
    }) => progressApi.updateProgress(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", studentId] });
    },
  });
}

export function useDeleteProgress(studentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      progressApi.deleteProgress(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", studentId] });
    },
  });
}
