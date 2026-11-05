import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as studentsApi from "./api";
import type { StudentFormValues } from "./types";

export const studentsQueryKey = (search?: string) =>
  ["students", search ?? ""] as const;

export function useStudents(search?: string) {
  return useQuery({
    queryKey: studentsQueryKey(search),
    queryFn: () => studentsApi.listStudents(search),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: StudentFormValues & { signal?: AbortSignal }) =>
      studentsApi.createStudent(input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<Omit<StudentFormValues, "email">>;
      signal?: AbortSignal;
    }) => studentsApi.updateStudent(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeactivateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      studentsApi.deactivateStudent(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUploadStudentAvatar() {
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
    }) => studentsApi.uploadStudentAvatar(id, file, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
