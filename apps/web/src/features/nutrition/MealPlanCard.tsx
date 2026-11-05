import { Droplets, Eye, Flame, Pencil, Trash2, UserRound } from "lucide-react";
import { STATUS_CLASSES, STATUS_LABELS } from "./constants";
import { mealIcon } from "./mealIcon";
import { totalCalories } from "./utils";
import type { MealPlan } from "./types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const MAX_VISIBLE_MEALS = 3;

interface MealPlanCardProps {
  plan: MealPlan;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MealPlanCard({
  plan,
  canManage,
  onView,
  onEdit,
  onDelete,
}: MealPlanCardProps) {
  const visibleMeals = plan.meals.slice(0, MAX_VISIBLE_MEALS);
  const extraCount = plan.meals.length - visibleMeals.length;
  const calories = totalCalories(plan.meals);

  return (
    <article className="panel meal-plan-card">
      <div className="meal-plan-card-head">
        <div>
          <span className={"status " + STATUS_CLASSES[plan.status]}>
            <i />
            {STATUS_LABELS[plan.status]}
          </span>
          <h3>{plan.title}</h3>
        </div>
        <div className="row-actions">
          <button className="icon-btn" title="Ver detalhes" onClick={onView}>
            <Eye size={14} />
          </button>
          {canManage && (
            <>
              <button className="icon-btn" title="Editar plano" onClick={onEdit}>
                <Pencil size={14} />
              </button>
              <button
                className="icon-btn icon-btn-danger"
                title="Excluir plano"
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
          {plan.student?.user.name ?? "Plano geral"}
        </span>
        {plan.goal && <span className="meal-plan-goal">{plan.goal}</span>}
      </div>

      <div className="meal-plan-stats">
        {calories !== null && (
          <span className="meal-plan-stat">
            <Flame size={12} /> {calories} kcal/dia
          </span>
        )}
        {plan.dailyWaterLiters && (
          <span className="meal-plan-stat">
            <Droplets size={12} /> {plan.dailyWaterLiters}L/dia
          </span>
        )}
      </div>

      <div className="meal-plan-list">
        {visibleMeals.map((meal) => {
          const Icon = mealIcon(meal.name);
          return (
            <div className="meal-plan-item" key={meal.id}>
              <span className="meal-plan-item-icon">
                <Icon size={13} />
              </span>
              <div className="meal-plan-item-text">
                <b>{meal.name}</b>
                <span>{meal.description}</span>
              </div>
              {meal.time && <small>{meal.time}</small>}
            </div>
          );
        })}
        {extraCount > 0 && (
          <button type="button" className="meal-plan-more" onClick={onView}>
            +{extraCount} refeição(ões) — ver tudo
          </button>
        )}
      </div>

      <div className="meal-plan-card-foot">
        <span>
          {plan.nutritionist
            ? `Responsável: ${plan.nutritionist.name}`
            : "Sem profissional vinculado"}
        </span>
        <span>{dateFormatter.format(new Date(plan.createdAt))}</span>
      </div>
    </article>
  );
}
