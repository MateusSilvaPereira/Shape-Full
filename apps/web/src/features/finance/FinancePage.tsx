import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stat } from "@/components/ui/Stat";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { useMemberships, useUpdateMembership } from "@/features/memberships/useMemberships";
import { getApiErrorMessage } from "@/lib/apiClient";
import { CHART_CHROME } from "@/lib/chartChrome";
import { useErrorToast } from "@/lib/useErrorToast";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "RECEPTIONIST"];

const STATUS_COLORS = {
  dark: { active: "#6ed7ad", pending: "#efb66d", overdue: "#e8596b", cancelled: "#79738a" },
  light: { active: "#1f7a53", pending: "#9a5a16", overdue: "#d23a4d", cancelled: "#8a8393" },
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

export function FinancePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const membershipsQuery = useMemberships();
  const updateMembership = useUpdateMembership();
  useErrorToast(
    membershipsQuery.isError,
    membershipsQuery.error,
    "Não foi possível carregar os dados financeiros.",
  );

  if (!canManage) {
    return (
      <>
        <PageHeading
          title="Financeiro"
          subtitle="Visão geral de receita e pagamentos da academia."
        />
        <Alert variant="info">
          Apenas administradores e recepcionistas podem acessar o financeiro.
        </Alert>
      </>
    );
  }

  const chrome = CHART_CHROME[theme];
  const colors = STATUS_COLORS[theme];
  const rows = membershipsQuery.data ?? [];

  const active = rows.filter((m) => m.status === "ACTIVE");
  const pending = rows.filter((m) => m.status === "PENDING");
  const overdue = rows.filter((m) => m.status === "OVERDUE");
  const cancelled = rows.filter((m) => m.status === "CANCELLED");

  const mrr = active.reduce((sum, m) => sum + Number(m.monthlyPrice), 0);
  const overdueValue = overdue.reduce((sum, m) => sum + Number(m.monthlyPrice), 0);
  const avgTicket = active.length > 0 ? mrr / active.length : 0;

  const pieData = [
    { label: "Ativas", value: active.length, color: colors.active },
    { label: "Pendentes", value: pending.length, color: colors.pending },
    { label: "Em atraso", value: overdue.length, color: colors.overdue },
    { label: "Canceladas", value: cancelled.length, color: colors.cancelled },
  ].filter((item) => item.value > 0);

  const revenueByPlan = Object.values(
    active.reduce<Record<string, { planName: string; total: number; count: number }>>(
      (acc, m) => {
        acc[m.planName] = acc[m.planName] ?? { planName: m.planName, total: 0, count: 0 };
        acc[m.planName].total += Number(m.monthlyPrice);
        acc[m.planName].count += 1;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.total - a.total);
  const maxPlanRevenue = revenueByPlan[0]?.total ?? 0;

  async function handleMarkAsPaid(id: string, studentName: string) {
    try {
      await run(`Atualizando matrícula de ${studentName}...`, (signal) =>
        updateMembership.mutateAsync({ id, input: { status: "ACTIVE" }, signal }),
      );
      toast.success(`Matrícula de ${studentName} marcada como paga.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, "Não foi possível atualizar a matrícula."));
    }
  }

  return (
    <>
      <PageHeading
        title="Financeiro"
        subtitle="Visão geral de receita e pagamentos da academia."
      />

      {membershipsQuery.isLoading && (
        <div className="stats-grid">
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
      )}

      {membershipsQuery.data && (
        <>
          <div className="stats-grid">
            <Stat
              title="Receita mensal recorrente"
              value={currencyFormatter.format(mrr)}
              icon={<Wallet />}
              tone="purple"
              sub={`${active.length} matrícula(s) ativa(s)`}
            />
            <Stat
              title="Ticket médio"
              value={currencyFormatter.format(avgTicket)}
              icon={<TrendingUp />}
              tone="blue"
              sub="por matrícula ativa"
            />
            <Stat
              title="Em atraso"
              value={currencyFormatter.format(overdueValue)}
              icon={<AlertTriangle />}
              tone="orange"
              sub={`${overdue.length} pagamento(s) pendente(s)`}
            />
            <Stat
              title="Alunos pagantes"
              value={String(active.length)}
              icon={<Users />}
              tone="green"
              sub={`de ${rows.length} matrículas no total`}
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel chart-panel">
              <div className="panel-head">
                <div className="panel-head-title">
                  <span className="panel-icon">
                    <TrendingUp size={14} />
                  </span>
                  <div>
                    <h3>Receita por plano</h3>
                    <p>Soma das mensalidades ativas por tipo de plano</p>
                  </div>
                </div>
              </div>
              {revenueByPlan.length === 0 ? (
                <EmptyState
                  icon={<Wallet size={20} />}
                  title="Nenhuma matrícula ativa"
                  description="Ative matrículas para ver a receita por plano."
                />
              ) : (
                <div className="finance-plan-list">
                  {revenueByPlan.map((plan) => (
                    <div className="finance-plan-row" key={plan.planName}>
                      <div className="finance-plan-row-head">
                        <b>{plan.planName}</b>
                        <span>
                          {currencyFormatter.format(plan.total)} · {plan.count} aluno(s)
                        </span>
                      </div>
                      <div className="finance-plan-bar">
                        <div
                          style={{
                            width: `${maxPlanRevenue ? (plan.total / maxPlanRevenue) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel goal-panel">
              <div className="panel-head">
                <div className="panel-head-title">
                  <span className="panel-icon">
                    <PieChartIcon size={14} />
                  </span>
                  <div>
                    <h3>Status das matrículas</h3>
                    <p>Distribuição de todas as matrículas</p>
                  </div>
                </div>
              </div>
              {pieData.length === 0 ? (
                <EmptyState
                  icon={<PieChartIcon size={20} />}
                  title="Nenhuma matrícula ainda"
                  description="Cadastre matrículas para ver a distribuição aqui."
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
                      <b>{rows.length}</b>
                      <span>total</span>
                    </div>
                  </div>
                  <div className="donut-legend">
                    {pieData.map((item) => (
                      <div className="donut-legend-item" key={item.label}>
                        <span className="donut-legend-dot" style={{ background: item.color }} />
                        <span>{item.label}</span>
                        <b>{item.value}</b>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="panel module-panel">
            <div className="panel-head">
              <div className="panel-head-title">
                <span className="panel-icon">
                  <AlertTriangle size={14} />
                </span>
                <div>
                  <h3>Pagamentos em atraso</h3>
                  <p>Matrículas que precisam de atenção</p>
                </div>
              </div>
            </div>
            {overdue.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={22} />}
                title="Nenhum pagamento em atraso"
                description="Todas as matrículas estão em dia."
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ALUNO</th>
                      <th>PLANO</th>
                      <th>VALOR</th>
                      <th>VENCIMENTO</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="student-cell">
                            <div>
                              <b>{m.student.user.name}</b>
                              <small>{m.student.user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{m.planName}</td>
                        <td>{currencyFormatter.format(Number(m.monthlyPrice))}</td>
                        <td>{m.endDate ? dateFormatter.format(new Date(m.endDate)) : "—"}</td>
                        <td>
                          <button
                            className="btn-secondary"
                            onClick={() => handleMarkAsPaid(m.id, m.student.user.name)}
                          >
                            <CheckCircle2 size={13} /> Marcar como pago
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
