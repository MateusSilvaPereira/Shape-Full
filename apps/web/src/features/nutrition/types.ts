export type MealPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string | null;
  description: string;
  calories: number | null;
  order: number;
}

export interface MealPlan {
  id: string;
  academyId: string;
  studentId: string | null;
  nutritionistId: string | null;
  title: string;
  description: string | null;
  goal: string | null;
  status: MealPlanStatus;
  dailyWaterLiters: number | null;
  createdAt: string;
  updatedAt: string;
  meals: Meal[];
  student: {
    id: string;
    user: { id: string; name: string };
  } | null;
  nutritionist: StaffMember | null;
}

export interface MealInput {
  name: string;
  time?: string;
  description: string;
  calories?: number;
}

export interface MealPlanFormValues {
  title: string;
  description?: string;
  goal?: string;
  status?: MealPlanStatus;
  dailyWaterLiters?: number;
  studentId?: string;
  nutritionistId?: string;
  meals: MealInput[];
}
