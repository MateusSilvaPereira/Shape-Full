import { Dumbbell, Eye, Pencil, Trash2, Timer, UserRound } from "lucide-react";
import { resolveAssetUrl } from "@/lib/apiClient";
import type { TrainingProgram } from "./types";

const MAX_VISIBLE_ITEMS = 3;

interface TrainingProgramCardProps {
  program: TrainingProgram;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TrainingProgramCard({
  program,
  canManage,
  onView,
  onEdit,
  onDelete,
}: TrainingProgramCardProps) {
  const visibleItems = program.items.slice(0, MAX_VISIBLE_ITEMS);
  const extraCount = program.items.length - visibleItems.length;

  return (
    <article className="panel meal-plan-card">
      <div className="meal-plan-card-head">
        <div>
          <span className={"status " + (program.active ? "ativo" : "inativo")}>
            <i />
            {program.active ? "Ativo" : "Inativo"}
          </span>
          <h3>{program.title}</h3>
        </div>
        <div className="row-actions">
          <button className="icon-btn" title="Ver detalhes" onClick={onView}>
            <Eye size={14} />
          </button>
          {canManage && (
            <>
              <button className="icon-btn" title="Editar programa" onClick={onEdit}>
                <Pencil size={14} />
              </button>
              <button
                className="icon-btn icon-btn-danger"
                title="Excluir programa"
                onClick={onDelete}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="meal-plan-card-meta">
        <span className="meal-plan-badge">
          <UserRound size={11} />
          {program.student?.user.name ?? "Programa geral"}
        </span>
        {program.goal && <span className="meal-plan-goal">{program.goal}</span>}
      </div>

      <div className="meal-plan-list">
        {visibleItems.map((item) => (
          <div className="meal-plan-item" key={item.id}>
            <span className="meal-plan-item-icon">
              {item.exercise?.imageUrl ? (
                <img src={resolveAssetUrl(item.exercise.imageUrl) ?? ""} alt={item.exerciseName} />
              ) : (
                <Dumbbell size={13} />
              )}
            </span>
            <div className="meal-plan-item-text">
              <b>{item.exerciseName}</b>
              <span>
                {item.sets}x{item.reps}
              </span>
            </div>
            {item.restSeconds != null && (
              <small>
                <Timer size={11} style={{ verticalAlign: "-2px", marginRight: 3 }} />
                {item.restSeconds}s
              </small>
            )}
          </div>
        ))}
        {extraCount > 0 && (
          <button type="button" className="meal-plan-more" onClick={onView}>
            +{extraCount} exercício(s) — ver tudo
          </button>
        )}
      </div>

      <div className="meal-plan-card-foot">
        <span>Criado por: {program.createdBy.name}</span>
      </div>
    </article>
  );
}
