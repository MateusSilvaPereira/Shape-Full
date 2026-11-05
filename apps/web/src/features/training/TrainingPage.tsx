import { useState } from "react";
import { Dumbbell, Plus, Search } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useErrorToast } from "@/lib/useErrorToast";
import { TrainingProgramCard } from "./TrainingProgramCard";
import { TrainingProgramDetailModal } from "./TrainingProgramDetailModal";
import { TrainingProgramFormModal } from "./TrainingProgramFormModal";
import { useDeleteTrainingProgram, useTrainingPrograms } from "./useTraining";
import type { TrainingProgram } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "TRAINER"];

function CardSkeleton() {
  return (
    <div className="panel meal-plan-card">
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={10} className="skeleton-block" />
      <div className="skeleton-rows" style={{ marginTop: 16 }}>
        <div className="skeleton-row">
          <Skeleton width={26} height={26} radius={8} />
          <div className="skeleton-row-lines">
            <Skeleton width="70%" height={10} />
            <Skeleton width="50%" height={9} />
          </div>
        </div>
        <div className="skeleton-row">
          <Skeleton width={26} height={26} radius={8} />
          <div className="skeleton-row-lines">
            <Skeleton width="65%" height={10} />
            <Skeleton width="45%" height={9} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrainingPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const programsQuery = useTrainingPrograms(debouncedQuery || undefined);
  const deleteProgram = useDeleteTrainingProgram();
  useErrorToast(
    programsQuery.isError,
    programsQuery.error,
    "Não foi possível carregar os programas de treino.",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<TrainingProgram | undefined>(undefined);
  const [viewing, setViewing] = useState<TrainingProgram | undefined>(undefined);

  function openCreate() {
    setSelected(undefined);
    setModalOpen(true);
  }

  function openEdit(program: TrainingProgram) {
    setSelected(program);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(undefined);
  }

  async function handleDelete(program: TrainingProgram) {
    const ok = await confirm({
      title: "Excluir programa de treino",
      message: `Tem certeza que deseja excluir "${program.title}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Excluindo ${program.title}...`, (signal) =>
        deleteProgram.mutateAsync({ id: program.id, signal }),
      );
      toast.success(`${program.title} foi excluído com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(
        getApiErrorMessage(err, `Não foi possível excluir ${program.title}.`),
      );
    }
  }

  return (
    <>
      <PageHeading
        title="Treinos"
        subtitle="Monte e acompanhe os programas de treino dos seus alunos."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={17} /> Novo programa
            </button>
          )
        }
      />

      <div className="table-toolbar">
        <div className="searchbox wide">
          <Search size={16} />
          <input
            placeholder="Pesquisar programa por título..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {programsQuery.isError && (
        <Alert variant="error">
          {getApiErrorMessage(
            programsQuery.error,
            "Erro ao carregar programas de treino.",
          )}
        </Alert>
      )}

      {programsQuery.isLoading && (
        <div className="meal-plan-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {programsQuery.data && programsQuery.data.length === 0 && (
        <EmptyState
          icon={<Dumbbell size={24} />}
          title={query ? "Nenhum programa encontrado" : "Nenhum programa de treino ainda"}
          description={
            query
              ? "Tente buscar por outro título."
              : "Crie o primeiro programa de treino para seus alunos."
          }
          action={
            canManage &&
            !query && (
              <button className="btn-primary" onClick={openCreate}>
                <Plus size={16} /> Novo programa
              </button>
            )
          }
        />
      )}

      {programsQuery.data && programsQuery.data.length > 0 && (
        <div className="meal-plan-grid">
          {programsQuery.data.map((program) => (
            <TrainingProgramCard
              key={program.id}
              program={program}
              canManage={canManage}
              onView={() => setViewing(program)}
              onEdit={() => openEdit(program)}
              onDelete={() => handleDelete(program)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <TrainingProgramFormModal program={selected} onClose={closeModal} />
      )}
      {viewing && (
        <TrainingProgramDetailModal
          program={viewing}
          onClose={() => setViewing(undefined)}
        />
      )}
    </>
  );
}
