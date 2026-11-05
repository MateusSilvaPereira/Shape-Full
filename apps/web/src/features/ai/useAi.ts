import { useMutation } from "@tanstack/react-query";
import * as aiApi from "./api";
import type { ChatMessage, GenerateMealPlanInput, GenerateTrainingProgramInput } from "./types";

export function useGenerateTrainingProgram() {
  return useMutation({
    mutationFn: ({
      signal,
      ...input
    }: GenerateTrainingProgramInput & { signal?: AbortSignal }) =>
      aiApi.generateTrainingProgram(input, signal),
  });
}

export function useGenerateMealPlan() {
  return useMutation({
    mutationFn: ({ signal, ...input }: GenerateMealPlanInput & { signal?: AbortSignal }) =>
      aiApi.generateMealPlan(input, signal),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: ({
      message,
      history,
      signal,
    }: {
      message: string;
      history: ChatMessage[];
      signal?: AbortSignal;
    }) => aiApi.sendChatMessage(message, history, signal),
  });
}
