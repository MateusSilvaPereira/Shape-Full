import {
  Activity,
  Apple,
  BarChart3,
  ClipboardList,
  Dumbbell,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  Weight,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@fitness360/shared";

const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ACADEMY_ADMIN",
  "TRAINER",
  "NUTRITIONIST",
  "RECEPTIONIST",
];

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ACADEMY_ADMIN"];
const ALL_ROLES: UserRole[] = [...STAFF_ROLES, "STUDENT"];

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  group: string;
  /** Papéis que podem ver o item. Quando omitido, visível para toda a equipe (não alunos). */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Visão geral", path: "/", icon: LayoutDashboard, group: "MENU PRINCIPAL" },
  {
    label: "Meus treinos",
    path: "/meus-treinos",
    icon: Dumbbell,
    group: "MENU PRINCIPAL",
    roles: ["STUDENT"],
  },
  {
    label: "Assistente IA",
    path: "/assistente",
    icon: Sparkles,
    group: "MENU PRINCIPAL",
    roles: ALL_ROLES,
  },
  { label: "Alunos", path: "/alunos", icon: Users, group: "GESTÃO" },
  {
    label: "Profissionais",
    path: "/profissionais",
    icon: UserRound,
    group: "GESTÃO",
    roles: ADMIN_ROLES,
  },
  { label: "Treinos", path: "/treinos", icon: Dumbbell, group: "FITNESS" },
  { label: "Exercícios", path: "/exercicios", icon: Activity, group: "FITNESS" },
  { label: "Nutrição", path: "/nutricao", icon: Apple, group: "FITNESS" },
  { label: "Evolução", path: "/evolucao", icon: Weight, group: "FITNESS" },
  { label: "Planos e matrículas", path: "/planos", icon: ClipboardList, group: "GESTÃO" },
  { label: "Financeiro", path: "/financeiro", icon: Wallet, group: "GESTÃO" },
  { label: "Relatórios", path: "/relatorios", icon: BarChart3, group: "GESTÃO" },
  {
    label: "Conteúdo e banners",
    path: "/conteudo",
    icon: FileText,
    group: "PLATAFORMA",
    roles: ADMIN_ROLES,
  },
  { label: "Configurações", path: "/configuracoes", icon: Settings, group: "PLATAFORMA" },
];

export function visibleNavItems(role: UserRole | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) =>
    item.roles ? role && item.roles.includes(role) : role && STAFF_ROLES.includes(role),
  );
}

export const NAV_GROUPS = [...new Set(NAV_ITEMS.map((item) => item.group))];

/** Cor de destaque por grupo, usada para separar visualmente os temas do menu. */
export const GROUP_ACCENTS: Record<string, string> = {
  "MENU PRINCIPAL": "var(--brand-tint-fg)",
  GESTÃO: "var(--tone-blue-fg)",
  FITNESS: "var(--tone-green-fg)",
  PLATAFORMA: "var(--tone-orange-fg)",
};
