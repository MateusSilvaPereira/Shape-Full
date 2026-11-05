import { useMemo, useState } from "react";
import { AlertTriangle, Clock, CreditCard, Plus, Search, Wallet } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { Stat } from "@/components/ui/Stat";
import { TableRowsSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useErrorToast } from "@/lib/useErrorToast";
import { getApiErrorMessage } from "@/lib/apiClient";
import { STATUS_LABELS } from "./constants";
import { MembershipFormModal } from "./MembershipFormModal";
import { MembershipTable } from "./MembershipTable";
import { useDeleteMembership, useMemberships } from "./useMemberships";
import type { Membership, MembershipStatus } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "RECEPTIONIST"];
const DELETE_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN"];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function MembershipsPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));
  const canDelete = Boolean(user && DELETE_ROLES.includes(user.role));

  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "">("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const membershipsQuery = useMemberships(statusFilter);
  const deleteMembership = useDeleteMembership();
  useErrorToast(
    membershipsQuery.isError,
    membershipsQuery.error,
    "Não foi possível carregar as matrículas.",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Membership | undefined>(undefined);

  const allRows = membershipsQuery.data ?? [];
  const filteredRows = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return allRows;
    return allRows.filter(
      (m) =>
        m.student.user.name.toLowerCase().includes(term) ||
        m.planName.toLowerCase().includes(term),
    );
  }, [allRows, debouncedQuery]);

  const mrr = allRows
    .filter((m) => m.status === "ACTIVE")
    .reduce((sum, m) => sum + Number(m.monthlyPrice), 0);
  const pendingCount = allRows.filter((m) => m.status === "PENDING").length;
  const overdueCount = allRows.filter((m) => m.status === "OVERDUE").length;
  const activeCount = allRows.filter((m) => m.status === "ACTIVE").length;

  function openCreate() {
    setSelected(undefined);
    setModalOpen(true);
  }

  function openEdit(membership: Membership) {
    setSelected(membership);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(undefined);
  }

  async function handleDelete(membership: Membership) {
    const ok = await confirm({
      title: "Excluir matrícula",
      message: `Tem certeza que deseja excluir a matrícula de "${membership.student.user.name}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Excluindo matrícula de ${membership.student.user.name}...`, (signal) =>
        deleteMembership.mutateAsync({ id: membership.id, signal }),
      );
      toast.success(
        `Matrícula de ${membership.student.user.name} foi excluída com sucesso.`,
      );
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(
        getApiErrorMessage(
          err,
          `Não foi possível excluir a matrícula de ${membership.student.user.name}.`,
        ),
      );
    }
  }

  return (
    <>
      <PageHeading
        title="Planos e matrículas"
        subtitle="Gerencie os planos, matrículas e status de pagamento dos alunos."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={17} /> Nova matrícula
            </button>
          )
        }
      />

      <div className="stats-grid">
        <Stat
          title="Receita mensal recorrente"
          value={currencyFormatter.format(mrr)}
          icon={<Wallet />}
          tone="purple"
          sub={`${activeCount} matrícula(s) ativa(s)`}
        />
        <Stat
          title="Pendentes"
          value={String(pendingCount)}
          icon={<Clock />}
          tone="orange"
          sub="aguardando ativação"
        />
        <Stat
          title="Em atraso"
          value={String(overdueCount)}
          icon={<AlertTriangle />}
          tone="blue"
          sub="pagamentos vencidos"
        />
        <Stat
          title="Total de matrículas"
          value={String(allRows.length)}
          icon={<CreditCard />}
          tone="green"
          sub="no total cadastradas"
        />
      </div>

      <section className="panel module-panel">
        <div className="table-toolbar">
          <div className="searchbox wide">
            <Search size={16} />
            <input
              placeholder="Pesquisar por aluno ou plano..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | "")}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {membershipsQuery.isLoading && (
          <div className="skeleton-wrap">
            <TableRowsSkeleton rows={5} />
          </div>
        )}
        {membershipsQuery.isError && (
          <Alert variant="error">
            {getApiErrorMessage(membershipsQuery.error, "Erro ao carregar matrículas.")}
          </Alert>
        )}
        {membershipsQuery.data && (
          <MembershipTable
            rows={filteredRows}
            canManage={canManage}
            canDelete={canDelete}
            onEdit={openEdit}
            onDelete={handleDelete}
            emptyMessage={
              query || statusFilter
                ? "Nenhuma matrícula encontrada para esse filtro."
                : "Nenhuma matrícula cadastrada ainda."
            }
          />
        )}
      </section>

      {modalOpen && (
        <MembershipFormModal membership={selected} onClose={closeModal} />
      )}
    </>
  );
}
