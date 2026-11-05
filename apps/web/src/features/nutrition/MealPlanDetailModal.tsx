import { Droplets, Flame } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { STATUS_CLASSES, STATUS_LABELS, staffRoleLabel } from "./constants";
import { mealIcon } from "./mealIcon";
import { totalCalories } from "./utils";
import type { MealPlan } from "./types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

interface MealPlanDetailModalProps {
  plan: MealPlan;
  onClose: () => void;
}

export function MealPlanDetailModal({ plan, onClose }: MealPlanDetailModalProps) {
  const calories = totalCalories(plan.meals);

  return (
    <Modal title={plan.title} onClose={onClose}>
      <div className="meal-detail">
        <div className="meal-detail-badges">
          <span className={"status " + STATUS_CLASSES[plan.status]}>
            <i />
            {STATUS_LABELS[plan.status]}
          </span>
          {plan.goal && <span className="meal-plan-goal">{plan.goal}</span>}
        </div>

        {plan.description && <p className="meal-detail-description">{plan.description}</p>}

        <div className="meal-detail-meta">
          <div>
            <small>Aluno</small>
            <b>{plan.student?.user.name ?? "Plano geral"}</b>
          </div>
          <div>
            <small>Profissional responsável</small>
            <b>
              {plan.nutritionist
                ? `${plan.nutritionist.name} · ${staffRoleLabel(plan.nutritionist.role)}`
                : "Não vinculado"}
            </b>
          </div>
          <div>
            <small>Criado em</small>
            <b>{dateFormatter.format(new Date(plan.createdAt))}</b>
          </div>
        </div>

        {(calories !== null || plan.dailyWaterLiters) && (
          <div className="meal-detail-stats">
            {calories !== null && (
              <div className="meal-detail-stat">
                <Flame size={14} />
                <div>
                  <b>{calories} kcal</b>
                  <span>estimativa diária</span>
                </div>
              </div>
            )}
            {plan.dailyWaterLiters && (
              <div className="meal-detail-stat">
                <Droplets size={14} />
                <div>
                  <b>{plan.dailyWaterLiters}L</b>
                  <span>meta de água/dia</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="meal-detail-list">
          {plan.meals.map((meal) => {
            const Icon = mealIcon(meal.name);
            const share =
              calories && meal.calories
                ? Math.round((meal.calories / calories) * 100)
                : null;
            return (
              <div className="meal-detail-item" key={meal.id}>
                <div className="meal-detail-item-head">
                  <span className="meal-plan-item-icon">
                    <Icon size={13} />
                  </span>
                  <b>{meal.name}</b>
                  {meal.time && <small>{meal.time}</small>}
                  {meal.calories != null && (
                    <small className="meal-detail-kcal">{meal.calories} kcal</small>
                  )}
                </div>
                <p>{meal.description}</p>
                {share !== null && (
                  <div className="meal-detail-bar">
                    <div style={{ width: `${share}%` }} />
                  </div>
                )}
              </div>
            );
          })}
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
