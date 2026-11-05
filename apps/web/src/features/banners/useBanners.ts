import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bannersApi from "./api";
import type { BannerMetaInput } from "./types";

export function useBanners(enabled = true) {
  return useQuery({
    queryKey: ["banners"],
    queryFn: ({ signal }) => bannersApi.listBanners(signal),
    enabled,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      meta,
      signal,
    }: {
      file: File;
      meta: BannerMetaInput;
      signal?: AbortSignal;
    }) => bannersApi.createBanner(file, meta, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<BannerMetaInput>;
      signal?: AbortSignal;
    }) => bannersApi.updateBanner(id, input, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
  });
}

export function useUpdateBannerImage() {
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
    }) => bannersApi.updateBannerImage(id, file, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      bannersApi.deleteBanner(id, signal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
  });
}
