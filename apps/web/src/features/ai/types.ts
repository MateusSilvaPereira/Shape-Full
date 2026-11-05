export interface GenerateTrainingProgramInput {
  goal: string;
  daysPerWeek: number;
  experienceLevel?: "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
  notes?: string;
  studentId?: string;
}

export interface GeneratedTrainingItem {
  exerciseId?: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
}

export interface GeneratedTrainingProgram {
  title: string;
  description?: string;
  goal?: string;
  items: GeneratedTrainingItem[];
}

export interface GenerateMealPlanInput {
  goal: string;
  dailyCalories?: number;
  mealsPerDay?: number;
  restrictions?: string;
  studentId?: string;
}

export interface GeneratedMeal {
  name: string;
  time?: string;
  description: string;
  calories?: number;
}

export interface GeneratedMealPlan {
  title: string;
  description?: string;
  goal?: string;
  dailyWaterLiters?: number;
  meals: GeneratedMeal[];
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}
