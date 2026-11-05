import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as nutritionApi from "./api";
import type { MealPlanFormValues } from "./types";

export function useMealPlans(search?: string) {
  return useQuery({
    queryKey: ["meal-plans", search ?? ""],
    queryFn: ({ signal }) => nutritionApi.listMealPlans(search, signal),
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: ({ signal }) => nutritionApi.listStaff(signal),
    staleTime: 5 * 60_000,
  });
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: MealPlanFormValues & { signal?: AbortSignal }) =>
      nutritionApi.createMealPlan(input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
    },
  });
}

export function useUpdateMealPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      signal,
    }: {
      id: string;
      input: Partial<MealPlanFormValues>;
      signal?: AbortSignal;
    }) => nutritionApi.updateMealPlan(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
    },
  });
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: AbortSignal }) =>
      nutritionApi.deleteMealPlan(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
    },
  });
}
