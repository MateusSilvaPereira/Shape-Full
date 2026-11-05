import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Cake,
  CalendarDays,
  Gift,
  PartyPopper,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { useOverlayNavigate } from "@/components/layout/useOverlayNavigate";
import { Alert } from "@/components/ui/Alert";
import { PageHeading } from "@/components/layout/PageHeading";
import { Carousel } from "@/components/ui/Carousel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stat } from "@/components/ui/Stat";
import { StatCardSkeleton, TableRowsSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { useStudents } from "@/features/students/useStudents";
import { StudentTable } from "@/features/students/StudentTable";
import { getApiErrorMessage } from "@/lib/apiClient";
import { getBrandPalette } from "@/lib/color";
import { CHART_CHROME } from "@/lib/chartChrome";
import { useErrorToast } from "@/lib/useErrorToast";
import {
  expiringMemberships,
  membershipBreakdown,
  signupTrend,
  upcomingBirthdays,
} from "./utils";

const ACADEMY_PHOTOS = [
  { src: "/gallery/academia-1.jpg", alt: "Matricule-se na Shape Full" },
  { src: "/gallery/academia-2.jpg", alt: "Estrutura da Shape Full Academia" },
  { src: "/gallery/academia-3.jpg", alt: "Aluna treinando com acompanhamento" },
  { src: "/gallery/academia-4.jpg", alt: "Aluno treinando na smith machine" },
  { src: "/gallery/academia-5.jpg", alt: "Treino assistido por personal" },
];

const STATUS_COLORS = {
  dark: { active: "#6ed7ad", pending: "#efb66d", overdue: "#e8596b", cancelled: "#79738a" },
  light: { active: "#1f7a53", pending: "#9a5a16", overdue: "#d23a4d", cancelled: "#8a8393" },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardPage() {
  const { user, academy } = useAuth();
  const { theme } = useTheme();
  const goTo = useOverlayNavigate();
  const studentsQuery = useStudents();
  const students = studentsQuery.data ?? [];
  const isLoading = studentsQuery.isLoading;
  useErrorToast(
    studentsQuery.isError,
    studentsQuery.error,
    "Não foi possível carregar os dados do dashboard.",
  );

  const activeCount = students.filter((s) => s.user.status === "ACTIVE").length;
  const breakdown = membershipBreakdown(students);
  const expiring = expiringMemberships(students);
  const birthdays = upcomingBirthdays(students);
  const trend = signupTrend(students);
  const activeRate = breakdown.total
    ? Math.round((breakdown.active / breakdown.total) * 100)
    : 0;

  const firstName = user?.name.split(" ")[0] ?? "";
  const palette = getBrandPalette(academy?.primaryColor ?? "#6b2fa3", theme);
  const chrome = CHART_CHROME[theme];
  const statusColors = STATUS_COLORS[theme];

  const legendItems = [
    { label: "Ativo", value: breakdown.active, color: statusColors.active },
    { label: "Pendente", value: breakdown.pending, color: statusColors.pending },
    { label: "Vencido", value: breakdown.overdue, color: statusColors.overdue },
    { label: "Cancelado", value: breakdown.cancelled, color: statusColors.cancelled },
    { label: "Sem plano", value: breakdown.noPlan, color: palette.brandTintFg },
  ];
  const pieData = legendItems.filter((item) => item.value > 0);

  return (
    <>
      <PageHeading
        title={`${greeting()}, ${firstName}! 👋`}
        subtitle="Aqui está o resumo da sua academia hoje."
      />

      {studentsQuery.isError && (
        <Alert variant="error">
          {getApiErrorMessage(studentsQuery.error, "Erro ao carregar dados.")}
        </Alert>
      )}

      <Carousel images={ACADEMY_PHOTOS} intervalMs={5000} />

      <div className="stats-grid">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Stat
              title="Alunos ativos"
              value={String(activeCount)}
              icon={<Users />}
              tone="purple"
              sub={`de ${breakdown.total} cadastrados`}
            />
            <Stat
              title="Taxa de alunos ativos"
              value={`${activeRate}%`}
              icon={<Activity />}
              tone="blue"
              sub="sobre o total de alunos"
            />
            <Stat
              title="Matrículas pendentes"
              value={String(breakdown.pending)}
              icon={<Users />}
              tone="orange"
              sub="aguardando ativação do plano"
            />
            <Stat
              title="Planos vencendo"
              value={String(expiring.length)}
              icon={<CalendarDays />}
              tone="green"
              sub="nos próximos 7 dias"
            />
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div className="panel-head-title">
              <span className="panel-icon">
                <TrendingUp size={14} />
              </span>
              <div>
                <h3>Visão geral de alunos</h3>
                <p>Novas matrículas acumuladas neste mês</p>
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span />
            <b>Alunos cadastrados</b>
            <strong>{trend.at(-1)?.value ?? 0}</strong>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.brandHover} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={palette.brandHover} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chrome.grid} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: chrome.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: chrome.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: chrome.tooltipBg,
                    border: `1px solid ${chrome.tooltipBorder}`,
                    borderRadius: 10,
                    color: chrome.tooltipText,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={palette.brandHover}
                  strokeWidth={2.5}
                  fill="url(#brandFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel goal-panel">
          <div className="panel-head">
            <div className="panel-head-title">
              <span className="panel-icon">
                <PieChartIcon size={14} />
              </span>
              <div>
                <h3>Status das matrículas</h3>
                <p>Distribuição dos planos dos alunos</p>
              </div>
            </div>
          </div>
          {breakdown.total === 0 ? (
            <EmptyState
              icon={<PieChartIcon size={20} />}
              title="Nenhuma matrícula ainda"
              description="Cadastre alunos com um plano para ver a distribuição aqui."
            />
          ) : (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="68%"
                      outerRadius="100%"
                      paddingAngle={pieData.length > 1 ? 3 : 0}
                      stroke="none"
                    >
                      {pieData.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: chrome.tooltipBg,
                        border: `1px solid ${chrome.tooltipBorder}`,
                        borderRadius: 10,
                        color: chrome.tooltipText,
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <b>{activeRate}%</b>
                  <span>ativos</span>
                </div>
              </div>
              <div className="donut-legend">
                {legendItems.map((item) => (
                  <div className="donut-legend-item" key={item.label}>
                    <span
                      className="donut-legend-dot"
                      style={{ background: item.color }}
                    />
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="lower-grid">
        <section className="panel table-panel">
          <div className="panel-head">
            <div className="panel-head-title">
              <span className="panel-icon">
                <Users size={14} />
              </span>
              <div>
                <h3>Alunos recentes</h3>
                <p>Últimos cadastros na academia</p>
              </div>
            </div>
            <a
              className="text-link"
              href="/alunos"
              onClick={(e) => {
                e.preventDefault();
                goTo("/alunos", "Alunos");
              }}
            >
              Ver todos <span>→</span>
            </a>
          </div>
          {isLoading ? (
            <div className="skeleton-wrap">
              <TableRowsSkeleton rows={4} />
            </div>
          ) : (
            <StudentTable
              rows={[...students]
                .sort(
                  (a, b) =>
                    new Date(b.user.createdAt).getTime() -
                    new Date(a.user.createdAt).getTime(),
                )
                .slice(0, 4)}
              canManage={false}
              emptyMessage="Nenhum aluno cadastrado ainda."
            />
          )}
        </section>
        <section className="panel activity-panel">
          <div className="panel-head">
            <div className="panel-head-title">
              <span className="panel-icon">
                <Gift size={14} />
              </span>
              <div>
                <h3>Aniversariantes</h3>
                <p>Alunos que fazem aniversário em até 7 dias</p>
              </div>
            </div>
          </div>
          {!isLoading && birthdays.length === 0 && (
            <EmptyState
              icon={<PartyPopper size={20} />}
              title="Nenhum aniversariante nos próximos dias"
            />
          )}
          {birthdays.map(({ student, daysUntil }) => (
            <div className="activity-row" key={student.id}>
              <div className="activity-icon purple">
                <Cake size={14} />
              </div>
              <div className="activity-copy">
                <b>{student.user.name}</b>
                <span>
                  {daysUntil === 0 ? "É hoje!" : `Em ${daysUntil} dia(s)`}
                </span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
