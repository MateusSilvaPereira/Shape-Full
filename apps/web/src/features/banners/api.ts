import { apiClient } from "@/lib/apiClient";
import type { Banner, BannerMetaInput } from "./types";

export function listBanners(signal?: AbortSignal) {
  return apiClient.get<Banner[]>("/banners", { signal }).then((res) => res.data);
}

export function createBanner(
  file: File,
  meta: BannerMetaInput,
  signal?: AbortSignal,
) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", meta.title);
  if (meta.linkUrl) formData.append("linkUrl", meta.linkUrl);
  if (meta.order !== undefined) formData.append("order", String(meta.order));
  if (meta.active !== undefined) formData.append("active", String(meta.active));
  return apiClient
    .post<Banner>("/banners", formData, { signal })
    .then((res) => res.data);
}

export function updateBanner(
  id: string,
  input: Partial<BannerMetaInput>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<Banner>(`/banners/${id}`, input, { signal })
    .then((res) => res.data);
}

export function updateBannerImage(id: string, file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient
    .post<Banner>(`/banners/${id}/image`, formData, { signal })
    .then((res) => res.data);
}

export function deleteBanner(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/banners/${id}`, { signal })
    .then((res) => res.data);
}
