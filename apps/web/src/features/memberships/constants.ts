import type { MembershipStatus } from "./types";

export const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: "Ativa",
  PENDING: "Pendente",
  OVERDUE: "Em atraso",
  CANCELLED: "Cancelada",
};

export const STATUS_CLASSES: Record<MembershipStatus, string> = {
  ACTIVE: "ativo",
  PENDING: "pendente",
  OVERDUE: "inativo",
  CANCELLED: "concluido",
};
