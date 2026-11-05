import { apiClient } from "@/lib/apiClient";
import type { MealPlan, MealPlanFormValues, StaffMember } from "./types";

export function listMealPlans(search?: string, signal?: AbortSignal) {
  return apiClient
    .get<MealPlan[]>("/meal-plans", {
      params: search ? { search } : {},
      signal,
    })
    .then((res) => res.data);
}

export function createMealPlan(input: MealPlanFormValues, signal?: AbortSignal) {
  return apiClient
    .post<MealPlan>("/meal-plans", input, { signal })
    .then((res) => res.data);
}

export function updateMealPlan(
  id: string,
  input: Partial<MealPlanFormValues>,
  signal?: AbortSignal,
) {
  return apiClient
    .patch<MealPlan>(`/meal-plans/${id}`, input, { signal })
    .then((res) => res.data);
}

export function deleteMealPlan(id: string, signal?: AbortSignal) {
  return apiClient
    .delete<{ success: true }>(`/meal-plans/${id}`, { signal })
    .then((res) => res.data);
}

export function listStaff(signal?: AbortSignal) {
  return apiClient
    .get<StaffMember[]>("/users", { signal })
    .then((res) => res.data);
}
