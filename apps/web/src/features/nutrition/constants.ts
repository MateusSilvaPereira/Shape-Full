import type { MealPlanStatus } from "./types";

export const GOAL_OPTIONS = [
  "Emagrecimento",
  "Hipertrofia",
  "Manutenção",
  "Performance esportiva",
  "Reeducação alimentar",
];

export const STATUS_LABELS: Record<MealPlanStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
};

export const STATUS_CLASSES: Record<MealPlanStatus, string> = {
  DRAFT: "pendente",
  ACTIVE: "ativo",
  COMPLETED: "concluido",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ACADEMY_ADMIN: "Administrador",
  TRAINER: "Treinador",
  NUTRITIONIST: "Nutricionista",
  RECEPTIONIST: "Recepção",
};

export function staffRoleLabel(role: string) {
  return ROLE_LABELS[role] ?? role;
}
