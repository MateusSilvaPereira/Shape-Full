import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as membershipsApi from "./api";
import type { MembershipFormValues, MembershipStatus } from "./types";

export function useMemberships(status?: MembershipStatus | "") {
  return useQuery({
    queryKey: ["memberships", status ?? ""],
    queryFn: ({ signal }) => membershipsApi.listMemberships(status, signal),
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: MembershipFormValues & { signal?: AbortSignal }) =>
      membershipsApi.createMembership(input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<MembershipFormValues>;
      signal?: AbortSignal;
    }) => membershipsApi.updateMembership(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      membershipsApi.deleteMembership(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
