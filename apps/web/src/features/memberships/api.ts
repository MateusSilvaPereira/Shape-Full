import { apiClient } from "@/lib/apiClient";
import type { Membership, MembershipFormValues, MembershipStatus } from "./types";

export function listMemberships(
  status?: MembershipStatus | "",
  signal?: AbortSignal,
) {
  return apiClient
    .get<Membership[]>("/memberships", {
      params: status ? { status } : {},
      signal,
    })
    .then((res) => res.data);
}

export function createMembership(
  input: MembershipFormValues,
  signal?: AbortSignal,
) {
  return apiClient
    .post<Membership>("/memberships", input, { signal })
    .then((res) => res.data);
}

export function updateMembership(
  id: string,
  input: Partial<MembershipFormValues>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<Membership>(`/memberships/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deleteMembership(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/memberships/${id}`, { signal })
    .then((res) => res.data);
}
