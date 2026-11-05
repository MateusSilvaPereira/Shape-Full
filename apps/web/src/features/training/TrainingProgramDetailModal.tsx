import { Dumbbell, Timer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { resolveAssetUrl } from "@/lib/apiClient";
import type { TrainingProgram } from "./types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

interface TrainingProgramDetailModalProps {
  program: TrainingProgram;
  onClose: () => void;
}

export function TrainingProgramDetailModal({
  program,
  onClose,
}: TrainingProgramDetailModalProps) {
  return (
    <Modal title={program.title} onClose={onClose}>
      <div className="meal-detail">
        <div className="meal-detail-badges">
          <span className={"status " + (program.active ? "ativo" : "inativo")}>
            <i />
            {program.active ? "Ativo" : "Inativo"}
          </span>
          {program.goal && <span className="meal-plan-goal">{program.goal}</span>}
        </div>

        {program.description && (
          <p className="meal-detail-description">{program.description}</p>
        )}

        <div className="meal-detail-meta">
          <div>
            <small>Aluno</small>
            <b>{program.student?.user.name ?? "Programa geral"}</b>
          </div>
          <div>
            <small>Criado por</small>
            <b>{program.createdBy.name}</b>
          </div>
          <div>
            <small>Criado em</small>
            <b>{dateFormatter.format(new Date(program.createdAt))}</b>
          </div>
        </div>

        <div className="meal-detail-list">
          {program.items.map((item) => (
            <div className="meal-detail-item" key={item.id}>
              <div className="meal-detail-item-head">
                <span className="meal-plan-item-icon">
                  {item.exercise?.imageUrl ? (
                    <img
                      src={resolveAssetUrl(item.exercise.imageUrl) ?? ""}
                      alt={item.exerciseName}
                    />
                  ) : (
                    <Dumbbell size={13} />
                  )}
                </span>
                <b>{item.exerciseName}</b>
                <small>
                  {item.sets}x{item.reps}
                </small>
                {item.restSeconds != null && (
                  <small className="meal-detail-kcal">
                    <Timer size={11} style={{ verticalAlign: "-2px", marginRight: 3 }} />
                    {item.restSeconds}s descanso
                  </small>
                )}
              </div>
              {item.exercise?.imageUrl && (
                <img
                  className="exercise-thumb"
                  style={{ maxWidth: 220, marginLeft: 32 }}
                  src={resolveAssetUrl(item.exercise.imageUrl) ?? ""}
                  alt={item.exerciseName}
                />
              )}
              {(item.notes || item.exercise?.instructions) && (
                <p>{item.notes || item.exercise?.instructions}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  );
}
