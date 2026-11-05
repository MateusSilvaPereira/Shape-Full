import { apiClient } from "@/lib/apiClient";
import type { AcademySettings, UpdateAcademyInput } from "./types";

export function getMyAcademy(signal?: AbortSignal) {
  return apiClient
    .get<AcademySettings>("/academies/me", { signal })
    .then((res) => res.data);
}

export function updateMyAcademy(input: UpdateAcademyInput, signal?: AbortSignal) {
  return apiClient
    .patch<AcademySettings>("/academies/me", input, { signal })
    .then((res) => res.data);
}

export function uploadAcademyLogo(file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append("logo", file);
  return apiClient
    .post<AcademySettings>("/academies/me/logo", formData, { signal })
    .then((res) => res.data);
}
