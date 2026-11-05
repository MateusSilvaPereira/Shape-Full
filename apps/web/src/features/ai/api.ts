import { apiClient } from "@/lib/apiClient";
import type {
  ChatMessage,
  GenerateMealPlanInput,
  GeneratedMealPlan,
  GenerateTrainingProgramInput,
  GeneratedTrainingProgram,
} from "./types";

export function generateTrainingProgram(
  input: GenerateTrainingProgramInput,
  signal?: AbortSignal,
) {
  return apiClient
    .post<GeneratedTrainingProgram>("/ai/training-program", input, { signal })
    .then((res) => res.data);
}

export function generateMealPlan(input: GenerateMealPlanInput, signal?: AbortSignal) {
  return apiClient
    .post<GeneratedMealPlan>("/ai/meal-plan", input, { signal })
    .then((res) => res.data);
}

export function sendChatMessage(
  message: string,
  history: ChatMessage[],
  signal?: AbortSignal,
) {
  return apiClient
    .post<{ reply: string }>("/ai/chat", { message, history }, { signal })
    .then((res) => res.data.reply);
}
