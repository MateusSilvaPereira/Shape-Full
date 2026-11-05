import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { TableRowsSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useErrorToast } from "@/lib/useErrorToast";
import { getApiErrorMessage } from "@/lib/apiClient";
import { ProfessionalFormModal } from "./ProfessionalFormModal";
import { ProfessionalTable } from "./ProfessionalTable";
import { useDeactivateProfessional, useProfessionals } from "./useProfessionals";
import type { Professional } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN"];

export function ProfessionalsPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const professionalsQuery = useProfessionals(debouncedQuery || undefined, canManage);
  const deactivateProfessional = useDeactivateProfessional();
  useErrorToast(
    professionalsQuery.isError,
    professionalsQuery.error,
    "Não foi possível carregar os profissionais.",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Professional | undefined>(undefined);

  function openCreate() {
    setSelected(undefined);
    setModalOpen(true);
  }

  function openEdit(professional: Professional) {
    setSelected(professional);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(undefined);
  }

  async function handleDeactivate(professional: Professional) {
    const ok = await confirm({
      title: "Desativar profissional",
      message: `Tem certeza que deseja desativar ${professional.name}?`,
      confirmLabel: "Desativar",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Desativando ${professional.name}...`, (signal) =>
        deactivateProfessional.mutateAsync({ id: professional.id, signal }),
      );
      toast.success(`${professional.name} foi desativado com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(
        getApiErrorMessage(err, `Não foi possível desativar ${professional.name}.`),
      );
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeading
          title="Profissionais"
          subtitle="Gerencie a equipe da sua academia."
        />
        <Alert variant="info">
          Apenas administradores podem gerenciar profissionais.
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeading
        title="Profissionais"
        subtitle="Gerencie treinadores, nutricionistas e recepção da sua academia."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={17} /> Novo profissional
          </button>
        }
      />

      <section className="panel module-panel">
        <div className="table-toolbar">
          <div className="searchbox wide">
            <Search size={16} />
            <input
              placeholder="Pesquisar por nome ou e-mail..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {professionalsQuery.isLoading && (
          <div className="skeleton-wrap">
            <TableRowsSkeleton rows={5} />
          </div>
        )}
        {professionalsQuery.isError && (
          <Alert variant="error">
            {getApiErrorMessage(
              professionalsQuery.error,
              "Erro ao carregar profissionais.",
            )}
          </Alert>
        )}
        {professionalsQuery.data && (
          <ProfessionalTable
            rows={professionalsQuery.data}
            canManage={canManage}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </section>

      {modalOpen && (
        <ProfessionalFormModal professional={selected} onClose={closeModal} />
      )}
    </>
  );
}
