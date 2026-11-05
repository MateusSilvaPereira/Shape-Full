import { useState } from "react";
import { Dumbbell, PlayCircle, Repeat, Timer } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { useErrorToast } from "@/lib/useErrorToast";
import { useMyTrainingPrograms } from "./useTraining";
import type { TrainingItem } from "./types";

function ExerciseDemoCard({ item }: { item: TrainingItem }) {
  const image = item.exercise?.imageUrl ? resolveAssetUrl(item.exercise.imageUrl) : null;
  return (
    <article className="panel my-exercise-card">
      <div className="my-exercise-media">
        {image ? (
          <img src={image} alt={item.exerciseName} />
        ) : (
          <div className="my-exercise-media-placeholder">
            <Dumbbell size={28} />
          </div>
        )}
      </div>
      <div className="my-exercise-body">
        <div className="my-exercise-head">
          <h3>{item.exerciseName}</h3>
          {item.exercise?.muscleGroup && (
            <span className="meal-plan-badge">{item.exercise.muscleGroup}</span>
          )}
        </div>
        <div className="my-exercise-stats">
          <span>
            <Repeat size={13} /> {item.sets}x{item.reps}
          </span>
          {item.restSeconds != null && (
            <span>
              <Timer size={13} /> {item.restSeconds}s descanso
            </span>
          )}
        </div>
        {(item.notes || item.exercise?.instructions) && (
          <p className="my-exercise-instructions">
            {item.notes || item.exercise?.instructions}
          </p>
        )}
        {item.exercise?.videoUrl && (
          <a
            href={item.exercise.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            <PlayCircle size={13} /> Ver vídeo demonstrativo
          </a>
        )}
      </div>
    </article>
  );
}

export function MyTrainingPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const programsQuery = useMyTrainingPrograms();
  useErrorToast(
    programsQuery.isError,
    programsQuery.error,
    "Não foi possível carregar seu treino.",
  );

  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  if (!isStudent) {
    return (
      <>
        <PageHeading title="Meus treinos" subtitle="Acompanhe seu programa de treino." />
        <Alert variant="info">Esta página é exclusiva para alunos.</Alert>
      </>
    );
  }

  const programs = programsQuery.data ?? [];
  const activeProgram =
    programs.find((p) => p.id === activeProgramId) ?? programs[0] ?? null;

  return (
    <>
      <PageHeading
        title="Meus treinos"
        subtitle="Veja como executar cada exercício do seu programa com fotos e vídeos."
      />

      {programsQuery.isError && (
        <Alert variant="error">
          {getApiErrorMessage(programsQuery.error, "Erro ao carregar seu treino.")}
        </Alert>
      )}

      {programsQuery.isLoading && (
        <div className="my-exercise-grid">
          <Skeleton height={260} />
          <Skeleton height={260} />
          <Skeleton height={260} />
        </div>
      )}

      {programsQuery.data && programs.length === 0 && (
        <EmptyState
          icon={<Dumbbell size={24} />}
          title="Nenhum treino ativo ainda"
          description="Seu professor ainda não montou um programa de treino para você. Volte em breve!"
        />
      )}

      {programs.length > 0 && activeProgram && (
        <>
          {programs.length > 1 && (
            <div className="table-toolbar">
              <select
                value={activeProgram.id}
                onChange={(e) => setActiveProgramId(e.target.value)}
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <section className="panel my-training-head">
            <div>
              <h2>{activeProgram.title}</h2>
              {activeProgram.goal && <span className="meal-plan-goal">{activeProgram.goal}</span>}
            </div>
            {activeProgram.description && <p>{activeProgram.description}</p>}
          </section>

          <div className="my-exercise-grid">
            {activeProgram.items.map((item) => (
              <ExerciseDemoCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
