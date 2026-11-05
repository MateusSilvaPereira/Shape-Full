import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as trainingApi from "./api";
import type { TrainingProgramFormValues } from "./types";

export function useTrainingPrograms(search?: string) {
  return useQuery({
    queryKey: ["training-programs", search ?? ""],
    queryFn: ({ signal }) => trainingApi.listTrainingPrograms(search, signal),
  });
}

export function useMyTrainingPrograms() {
  return useQuery({
    queryKey: ["training-programs", "me"],
    queryFn: ({ signal }) => trainingApi.listMyTrainingPrograms(signal),
  });
}

export function useCreateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: TrainingProgramFormValues & { signal?: AbortSignal }) =>
      trainingApi.createTrainingProgram(input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}

export function useUpdateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<TrainingProgramFormValues>;
      signal?: AbortSignal;
    }) => trainingApi.updateTrainingProgram(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}

export function useDeleteTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      trainingApi.deleteTrainingProgram(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}
