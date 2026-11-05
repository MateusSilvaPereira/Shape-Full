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
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { useStudents } from "@/features/students/useStudents";
import { useExercises } from "@/features/exercises/useExercises";
import { useGenerateTrainingProgram } from "@/features/ai/useAi";
import {
  useCreateTrainingProgram,
  useUpdateTrainingProgram,
} from "./useTraining";
import type { TrainingItemInput, TrainingProgram } from "./types";

interface TrainingProgramFormModalProps {
  program?: TrainingProgram;
  onClose: () => void;
}

const CUSTOM_EXERCISE = "__custom__";

function emptyItem(): TrainingItemInput {
  return { exerciseName: "", sets: 3, reps: "12", restSeconds: 60, notes: "" };
}

export function TrainingProgramFormModal({
  program,
  onClose,
}: TrainingProgramFormModalProps) {
  const isEditing = Boolean(program);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createProgram = useCreateTrainingProgram();
  const updateProgram = useUpdateTrainingProgram();
  const generateProgram = useGenerateTrainingProgram();
  const studentsQuery = useStudents();
  const exercisesQuery = useExercises();

  const [error, setError] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiDaysPerWeek, setAiDaysPerWeek] = useState("3");
  const [aiExperience, setAiExperience] = useState<
    "INICIANTE" | "INTERMEDIARIO" | "AVANCADO"
  >("INTERMEDIARIO");
  const [aiNotes, setAiNotes] = useState("");
  const [title, setTitle] = useState(program?.title ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [goal, setGoal] = useState(program?.goal ?? "");
  const [active, setActive] = useState(program?.active ?? true);
  const [studentId, setStudentId] = useState(program?.studentId ?? "");
  const [items, setItems] = useState<TrainingItemInput[]>(
    program?.items.length
      ? program.items.map((item) => ({
          exerciseId: item.exerciseId ?? undefined,
          exerciseName: item.exerciseName,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds ?? undefined,
          notes: item.notes ?? "",
        }))
      : [emptyItem()],
  );

  function updateItem(index: number, patch: Partial<TrainingItemInput>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!aiGoal.trim()) {
      toast.error("Descreva o objetivo do treino para a IA gerar.");
      return;
    }
    try {
      const result = await run("Gerando treino com IA...", (signal) =>
        generateProgram.mutateAsync({
          goal: aiGoal,
          daysPerWeek: Number(aiDaysPerWeek),
          experienceLevel: aiExperience,
          notes: aiNotes || undefined,
          studentId: studentId || undefined,
          signal,
        }),
      );
      setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.goal) setGoal(result.goal);
      setItems(
        result.items.map((item) => ({
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          notes: item.notes ?? "",
        })),
      );
      setAiOpen(false);
      toast.success("Treino gerado! Revise e ajuste antes de salvar.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Geração cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, "Não foi possível gerar o treino com IA."));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const payload = {
      title,
      description: description || undefined,
      goal: goal || undefined,
      active,
      studentId: studentId || undefined,
      items: items.map((item) => ({
        exerciseId: item.exerciseId || undefined,
        exerciseName: item.exerciseName,
        sets: item.sets,
        reps: item.reps,
        restSeconds: item.restSeconds || undefined,
        notes: item.notes || undefined,
      })),
    };

    try {
      if (isEditing && program) {
        await run(`Salvando ${title}...`, (signal) =>
          updateProgram.mutateAsync({ id: program.id, input: payload, signal }),
        );
        toast.success(`${title} foi atualizado com sucesso.`);
      } else {
        await run(`Criando ${title}...`, (signal) =>
          createProgram.mutateAsync({ ...payload, signal }),
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
          ? "Não foi possível atualizar o programa de treino."
          : "Não foi possível criar o programa de treino.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Modal
      title={isEditing ? "Editar programa de treino" : "Novo programa de treino"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>
          Título do programa
          <input
            required
            minLength={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Treino de hipertrofia ABC"
          />
        </label>

        <div className="ai-generate-box">
          <button
            type="button"
            className="text-link ai-generate-toggle"
            onClick={() => setAiOpen((v) => !v)}
          >
            <Sparkles size={14} /> {aiOpen ? "Fechar gerador de IA" : "Gerar treino com IA"}
          </button>
          {aiOpen && (
            <div className="ai-generate-panel">
              <label>
                Objetivo do treino
                <input
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="Ex: Hipertrofia de membros superiores"
                />
              </label>
              <div className="form-row">
                <label>
                  Dias por semana
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={aiDaysPerWeek}
                    onChange={(e) => setAiDaysPerWeek(e.target.value)}
                  />
                </label>
                <label>
                  Nível
                  <select
                    value={aiExperience}
                    onChange={(e) =>
                      setAiExperience(e.target.value as typeof aiExperience)
                    }
                  >
                    <option value="INICIANTE">Iniciante</option>
                    <option value="INTERMEDIARIO">Intermediário</option>
                    <option value="AVANCADO">Avançado</option>
                  </select>
                </label>
              </div>
              <label>
                Observações (opcional)
                <input
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Ex: evitar exercícios de impacto no joelho"
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
            Aluno
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Programa geral (sem aluno específico)</option>
              {studentsQuery.data?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Objetivo
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ex: Hipertrofia, emagrecimento..."
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Descrição
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações gerais do programa"
            />
          </label>
          <label>
            Status
            <select
              value={active ? "ACTIVE" : "INACTIVE"}
              onChange={(e) => setActive(e.target.value === "ACTIVE")}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </label>
        </div>

        <div className="meal-fields">
          <div className="meal-fields-head">
            <b>Exercícios</b>
            <button type="button" className="text-link" onClick={addItem}>
              <Plus size={13} /> Adicionar exercício
            </button>
          </div>
          {exercisesQuery.data?.length === 0 && (
            <Alert variant="info">
              Sua biblioteca de exercícios está vazia. Cadastre exercícios com foto
              ou GIF em "Exercícios" para que apareçam aqui e os alunos possam ver
              como executá-los.
            </Alert>
          )}
          {items.map((item, index) => {
            const selectedExercise = exercisesQuery.data?.find(
              (ex) => ex.id === item.exerciseId,
            );
            const isCustom = !item.exerciseId;
            return (
            <div className="meal-field-row" key={index}>
              <div className="form-row">
                <label>
                  Exercício
                  <select
                    value={item.exerciseId ?? CUSTOM_EXERCISE}
                    onChange={(e) => {
                      if (e.target.value === CUSTOM_EXERCISE) {
                        updateItem(index, { exerciseId: undefined, exerciseName: "" });
                        return;
                      }
                      const found = exercisesQuery.data?.find(
                        (ex) => ex.id === e.target.value,
                      );
                      updateItem(index, {
                        exerciseId: e.target.value,
                        exerciseName: found?.name ?? "",
                      });
                    }}
                  >
                    <option value={CUSTOM_EXERCISE}>Outro (digitar nome)</option>
                    {exercisesQuery.data?.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name} · {exercise.muscleGroup}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Séries
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.sets}
                    onChange={(e) =>
                      updateItem(index, { sets: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              {isCustom && (
                <label>
                  Nome do exercício
                  <input
                    required
                    value={item.exerciseName}
                    onChange={(e) =>
                      updateItem(index, { exerciseName: e.target.value })
                    }
                    placeholder="Ex: Supino reto"
                  />
                </label>
              )}
              {selectedExercise?.imageUrl && (
                <img
                  className="exercise-thumb"
                  style={{ maxWidth: 120 }}
                  src={resolveAssetUrl(selectedExercise.imageUrl) ?? ""}
                  alt={selectedExercise.name}
                />
              )}
              <div className="form-row">
                <label>
                  Repetições
                  <input
                    required
                    value={item.reps}
                    onChange={(e) => updateItem(index, { reps: e.target.value })}
                    placeholder="Ex: 10-12"
                  />
                </label>
                <label>
                  Descanso (segundos)
                  <input
                    type="number"
                    min="0"
                    value={item.restSeconds ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        restSeconds: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Ex: 60"
                  />
                </label>
              </div>
              <label>
                Observações
                <input
                  value={item.notes ?? ""}
                  onChange={(e) => updateItem(index, { notes: e.target.value })}
                  placeholder="Opcional"
                />
              </label>
              {items.length > 1 && (
                <button
                  type="button"
                  className="meal-field-remove"
                  onClick={() => removeItem(index)}
                  title="Remover exercício"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            );
          })}
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
