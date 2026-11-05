import { useState } from "react";
import { Dumbbell, Pencil, Plus, Search, Trash2, Video } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useErrorToast } from "@/lib/useErrorToast";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { ExerciseFormModal } from "./ExerciseFormModal";
import { useDeleteExercise, useExercises } from "./useExercises";
import type { Exercise } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "TRAINER"];

export function ExercisesPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const exercisesQuery = useExercises(debouncedQuery || undefined);
  const deleteExercise = useDeleteExercise();
  useErrorToast(
    exercisesQuery.isError,
    exercisesQuery.error,
    "Não foi possível carregar os exercícios.",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Exercise | undefined>(undefined);

  function openCreate() {
    setSelected(undefined);
    setModalOpen(true);
  }

  function openEdit(exercise: Exercise) {
    setSelected(exercise);
    setModalOpen(true);
  }

  async function handleDelete(exercise: Exercise) {
    const ok = await confirm({
      title: "Excluir exercício",
      message: `Tem certeza que deseja excluir "${exercise.name}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Excluindo ${exercise.name}...`, (signal) =>
        deleteExercise.mutateAsync({ id: exercise.id, signal }),
      );
      toast.success(`${exercise.name} foi excluído com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, `Não foi possível excluir ${exercise.name}.`));
    }
  }

  return (
    <>
      <PageHeading
        title="Exercícios"
        subtitle="Biblioteca de exercícios disponível para montar os treinos."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={17} /> Novo exercício
            </button>
          )
        }
      />

      <section className="panel module-panel">
        <div className="table-toolbar">
          <div className="searchbox wide">
            <Search size={16} />
            <input
              placeholder="Pesquisar por nome ou grupo muscular..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {exercisesQuery.isError && (
          <Alert variant="error">
            {getApiErrorMessage(exercisesQuery.error, "Erro ao carregar exercícios.")}
          </Alert>
        )}

        {exercisesQuery.isLoading && (
          <div className="meal-plan-grid" style={{ marginTop: 18 }}>
            <Skeleton height={90} />
            <Skeleton height={90} />
            <Skeleton height={90} />
          </div>
        )}

        {exercisesQuery.data && exercisesQuery.data.length === 0 && (
          <EmptyState
            icon={<Dumbbell size={24} />}
            title={query ? "Nenhum exercício encontrado" : "Nenhum exercício cadastrado"}
            description={
              query
                ? "Tente buscar por outro nome ou grupo muscular."
                : "Cadastre o primeiro exercício da biblioteca."
            }
            action={
              canManage &&
              !query && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus size={16} /> Novo exercício
                </button>
              )
            }
          />
        )}

        {exercisesQuery.data && exercisesQuery.data.length > 0 && (
          <div className="meal-plan-grid" style={{ marginTop: 18 }}>
            {exercisesQuery.data.map((exercise) => (
              <article className="panel exercise-card" key={exercise.id}>
                {exercise.imageUrl && (
                  <img
                    className="exercise-thumb"
                    src={resolveAssetUrl(exercise.imageUrl) ?? ""}
                    alt={exercise.name}
                  />
                )}
                <div className="meal-plan-card-head">
                  <div>
                    <span className="meal-plan-badge">{exercise.muscleGroup}</span>
                    <h3>{exercise.name}</h3>
                  </div>
                  {canManage && (
                    <div className="row-actions">
                      <button className="icon-btn" title="Editar" onClick={() => openEdit(exercise)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Excluir"
                        onClick={() => handleDelete(exercise)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {exercise.instructions && (
                  <p className="exercise-instructions">{exercise.instructions}</p>
                )}
                {exercise.videoUrl && (
                  <a
                    href={exercise.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                  >
                    <Video size={13} /> Ver vídeo demonstrativo
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <ExerciseFormModal exercise={selected} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
