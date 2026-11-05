import type { Meal } from "./types";

export function totalCalories(meals: Meal[]): number | null {
  const withCalories = meals.filter((m) => m.calories != null);
  if (withCalories.length === 0) return null;
  return withCalories.reduce((sum, m) => sum + (m.calories ?? 0), 0);
}
