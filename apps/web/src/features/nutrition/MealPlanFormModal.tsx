import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useAuth } from "@/features/auth/AuthContext";
import { useStudents } from "@/features/students/useStudents";
import { useGenerateMealPlan } from "@/features/ai/useAi";
import { GOAL_OPTIONS, STATUS_LABELS, staffRoleLabel } from "./constants";
import { useCreateMealPlan, useStaff, useUpdateMealPlan } from "./useMealPlans";
import type { MealInput, MealPlan, MealPlanStatus } from "./types";

interface MealPlanFormModalProps {
  plan?: MealPlan;
  onClose: () => void;
}

function emptyMeal(): MealInput {
  return { name: "", time: "", description: "", calories: undefined };
}

export function MealPlanFormModal({ plan, onClose }: MealPlanFormModalProps) {
  const isEditing = Boolean(plan);
  const { user } = useAuth();
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createMealPlan = useCreateMealPlan();
  const updateMealPlan = useUpdateMealPlan();
  const generateMealPlan = useGenerateMealPlan();
  const studentsQuery = useStudents();
  const staffQuery = useStaff();

  const [error, setError] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiCalories, setAiCalories] = useState("");
  const [aiMealsPerDay, setAiMealsPerDay] = useState("5");
  const [aiRestrictions, setAiRestrictions] = useState("");
  const [title, setTitle] = useState(plan?.title ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [goal, setGoal] = useState(plan?.goal ?? "");
  const [status, setStatus] = useState<MealPlanStatus>(plan?.status ?? "DRAFT");
  const [dailyWaterLiters, setDailyWaterLiters] = useState(
    plan?.dailyWaterLiters?.toString() ?? "",
  );
  const [studentId, setStudentId] = useState(plan?.studentId ?? "");
  const [nutritionistId, setNutritionistId] = useState(
    plan?.nutritionistId ?? user?.id ?? "",
  );
  const [meals, setMeals] = useState<MealInput[]>(
    plan?.meals.length
      ? plan.meals.map((m) => ({
          name: m.name,
          time: m.time ?? "",
          description: m.description,
          calories: m.calories ?? undefined,
        }))
      : [emptyMeal()],
  );

  function updateMeal(index: number, patch: Partial<MealInput>) {
    setMeals((prev) =>
      prev.map((meal, i) => (i === index ? { ...meal, ...patch } : meal)),
    );
  }

  function addMeal() {
    setMeals((prev) => [...prev, emptyMeal()]);
  }

  function removeMeal(index: number) {
    setMeals((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!aiGoal.trim()) {
      toast.error("Descreva o objetivo do plano para a IA gerar.");
      return;
    }
    try {
      const result = await run("Gerando plano alimentar com IA...", (signal) =>
        generateMealPlan.mutateAsync({
          goal: aiGoal,
          dailyCalories: aiCalories ? Number(aiCalories) : undefined,
          mealsPerDay: Number(aiMealsPerDay),
          restrictions: aiRestrictions || undefined,
          studentId: studentId || undefined,
          signal,
        }),
      );
      setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.goal) setGoal(result.goal);
      if (result.dailyWaterLiters) setDailyWaterLiters(String(result.dailyWaterLiters));
      setMeals(
        result.meals.map((meal) => ({
          name: meal.name,
          time: meal.time ?? "",
          description: meal.description,
          calories: meal.calories,
        })),
      );
      setAiOpen(false);
      toast.success("Plano alimentar gerado! Revise e ajuste antes de salvar.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Geração cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, "Não foi possível gerar o plano com IA."));
    }
  }

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const hasAnyCalories = meals.some((m) => m.calories);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const payload = {
      title,
      description: description || undefined,
      goal: goal || undefined,
      status,
      dailyWaterLiters: dailyWaterLiters ? Number(dailyWaterLiters) : undefined,
      studentId: studentId || undefined,
      nutritionistId: nutritionistId || undefined,
      meals: meals.map((m) => ({
        name: m.name,
        time: m.time || undefined,
        description: m.description,
        calories: m.calories || undefined,
      })),
    };

    try {
      if (isEditing && plan) {
        await run(`Salvando ${title}...`, (signal) =>
          updateMealPlan.mutateAsync({ id: plan.id, input: payload, signal }),
        );
        toast.success(`${title} foi atualizado com sucesso.`);
      } else {
        await run(`Criando ${title}...`, (signal) =>
          createMealPlan.mutateAsync({ ...payload, signal }),
        );
        toast.success(`${title} foi criado com sucesso.`);
      }
      onClose();
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      const message = getApiErrorMessage(
        err,
        isEditing
          ? "Não foi possível atualizar o plano alimentar."
          : "Não foi possível criar o plano alimentar.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Modal
      title={isEditing ? "Editar plano alimentar" : "Novo plano alimentar"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>
          Título do plano
          <input
            required
            minLength={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Plano de emagrecimento"
          />
        </label>

        <div className="ai-generate-box">
          <button
            type="button"
            className="text-link ai-generate-toggle"
            onClick={() => setAiOpen((v) => !v)}
          >
            <Sparkles size={14} /> {aiOpen ? "Fechar gerador de IA" : "Gerar plano com IA"}
          </button>
          {aiOpen && (
            <div className="ai-generate-panel">
              <label>
                Objetivo do plano
                <input
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="Ex: Emagrecimento com déficit moderado"
                />
              </label>
              <div className="form-row">
                <label>
                  Meta calórica diária (opcional)
                  <input
                    type="number"
                    min="0"
                    value={aiCalories}
                    onChange={(e) => setAiCalories(e.target.value)}
                    placeholder="Ex: 2000"
                  />
                </label>
                <label>
                  Refeições por dia
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={aiMealsPerDay}
                    onChange={(e) => setAiMealsPerDay(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Restrições/preferências (opcional)
                <input
                  value={aiRestrictions}
                  onChange={(e) => setAiRestrictions(e.target.value)}
                  placeholder="Ex: vegetariano, intolerância a lactose"
                />
              </label>
              <button type="button" className="btn-primary" onClick={handleGenerate}>
                <Sparkles size={14} /> Gerar com IA
              </button>
            </div>
          )}
        </div>

        <div className="form-row">
          <label>
            Profissional responsável
            <select
              value={nutritionistId}
              onChange={(e) => setNutritionistId(e.target.value)}
            >
              <option value="">Não vinculado</option>
              {staffQuery.data?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {staffRoleLabel(member.role)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Aluno
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Plano geral (sem aluno específico)</option>
              {studentsQuery.data?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Objetivo
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="">Não definido</option>
              {GOAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MealPlanStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Descrição
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo geral do plano"
            />
          </label>
          <label>
            Meta de água (L/dia)
            <input
              type="number"
              step="0.1"
              min="0"
              value={dailyWaterLiters}
              onChange={(e) => setDailyWaterLiters(e.target.value)}
              placeholder="Ex: 2.5"
            />
          </label>
        </div>

        <div className="meal-fields">
          <div className="meal-fields-head">
            <b>Refeições</b>
            <button type="button" className="text-link" onClick={addMeal}>
              <Plus size={13} /> Adicionar refeição
            </button>
          </div>
          {meals.map((meal, index) => (
            <div className="meal-field-row" key={index}>
              <div className="form-row">
                <label>
                  Nome
                  <input
                    required
                    value={meal.name}
                    onChange={(e) => updateMeal(index, { name: e.target.value })}
                    placeholder="Ex: Café da manhã"
                  />
                </label>
                <label>
                  Horário
                  <input
                    type="time"
                    value={meal.time}
                    onChange={(e) => updateMeal(index, { time: e.target.value })}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Descrição
                  <input
                    required
                    value={meal.description}
                    onChange={(e) =>
                      updateMeal(index, { description: e.target.value })
                    }
                    placeholder="O que comer nessa refeição"
                  />
                </label>
                <label>
                  Calorias (kcal)
                  <input
                    type="number"
                    min="0"
                    value={meal.calories ?? ""}
                    onChange={(e) =>
                      updateMeal(index, {
                        calories: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Opcional"
                  />
                </label>
              </div>
              {meals.length > 1 && (
                <button
                  type="button"
                  className="meal-field-remove"
                  onClick={() => removeMeal(index)}
                  title="Remover refeição"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {hasAnyCalories && (
            <div className="meal-fields-total">
              Total estimado: <b>{totalCalories} kcal/dia</b>
            </div>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
