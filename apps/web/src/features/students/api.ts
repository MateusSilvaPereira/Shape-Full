import { apiClient } from "@/lib/apiClient";
import type {
  CreateStudentResult,
  Student,
  StudentFormValues,
} from "./types";

export function listStudents(search?: string) {
  return apiClient
    .get<Student[]>("/students", { params: search ? { search } : {} })
    .then((res) => res.data);
}

export function createStudent(input: StudentFormValues, signal?: AbortSignal) {
  return apiClient
    .post<CreateStudentResult>("/students", input, { signal })
    .then((res) => res.data);
}

export function updateStudent(
  id: string,
  input: Partial<Omit<StudentFormValues, "email">>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<Student>(`/students/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deactivateStudent(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/students/${id}`, { signal })
    .then((res) => res.data);
}

export function uploadStudentAvatar(id: string, file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiClient
    .post<Student>(`/students/${id}/avatar`, formData, { signal })
    .then((res) => res.data);
}
