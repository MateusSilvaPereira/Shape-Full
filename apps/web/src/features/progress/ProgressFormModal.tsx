import { useState } from "react";
import type { FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useCreateProgress, useUpdateProgress } from "./useProgress";
import type { ProgressEntry } from "./types";

interface ProgressFormModalProps {
  studentId: string;
  studentName: string;
  entry?: ProgressEntry;
  onClose: () => void;
}

export function ProgressFormModal({
  studentId,
  studentName,
  entry,
  onClose,
}: ProgressFormModalProps) {
  const isEditing = Boolean(entry);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createProgress = useCreateProgress(studentId);
  const updateProgress = useUpdateProgress(studentId);

  const [error, setError] = useState("");
  const [weightKg, setWeightKg] = useState(entry?.weightKg?.toString() ?? "");
  const [bodyFatPct, setBodyFatPct] = useState(entry?.bodyFatPct?.toString() ?? "");
  const [waistCm, setWaistCm] = useState(entry?.waistCm?.toString() ?? "");
  const [measuredAt, setMeasuredAt] = useState(
    entry?.measuredAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      weightKg: weightKg ? Number(weightKg) : undefined,
      bodyFatPct: bodyFatPct ? Number(bodyFatPct) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      measuredAt: measuredAt || undefined,
      notes: notes || undefined,
    };
    try {
      if (isEditing && entry) {
        await run("Salvando registro...", (signal) =>
          updateProgress.mutateAsync({ id: entry.id, input: payload, signal }),
        );
        toast.success("Registro de evolução atualizado com sucesso.");
      } else {
        await run(`Registrando evolução de ${studentName}...`, (signal) =>
          createProgress.mutateAsync({ studentId, ...payload, signal }),
        );
        toast.success("Registro de evolução adicionado com sucesso.");
      }
      onClose();
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      const message = getApiErrorMessage(
        err,
        "Não foi possível salvar o registro de evolução.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Modal
      title={isEditing ? "Editar registro" : `Nova medição — ${studentName}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>
          Data da medição
          <input
            type="date"
            required
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Peso (kg)
            <input
              type="number"
              step="0.1"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </label>
          <label>
            Gordura corporal (%)
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={bodyFatPct}
              onChange={(e) => setBodyFatPct(e.target.value)}
            />
          </label>
        </div>
        <label>
          Cintura (cm)
          <input
            type="number"
            step="0.1"
            min="0"
            value={waistCm}
            onChange={(e) => setWaistCm(e.target.value)}
          />
        </label>
        <label>
          Observações
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: pós-feriado, início de novo ciclo..."
          />
        </label>
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
