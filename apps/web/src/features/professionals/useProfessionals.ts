import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as professionalsApi from "./api";
import type { ProfessionalFormValues } from "./types";

export function useProfessionals(search?: string, enabled = true) {
  return useQuery({
    queryKey: ["professionals", search ?? ""],
    queryFn: ({ signal }) => professionalsApi.listProfessionals(search, signal),
    enabled,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: ProfessionalFormValues & { signal?: AbortSignal }) =>
      professionalsApi.createProfessional(input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<Omit<ProfessionalFormValues, "email">>;
      signal?: AbortSignal;
    }) => professionalsApi.updateProfessional(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeactivateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      professionalsApi.deactivateProfessional(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUploadProfessionalAvatar() {
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
    }) => professionalsApi.uploadProfessionalAvatar(id, file, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
