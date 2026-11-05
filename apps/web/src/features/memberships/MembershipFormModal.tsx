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
import { useStudents } from "@/features/students/useStudents";
import { STATUS_LABELS } from "./constants";
import { useCreateMembership, useUpdateMembership } from "./useMemberships";
import type { Membership, MembershipStatus } from "./types";

interface MembershipFormModalProps {
  membership?: Membership;
  onClose: () => void;
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function MembershipFormModal({ membership, onClose }: MembershipFormModalProps) {
  const isEditing = Boolean(membership);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembership();
  const studentsQuery = useStudents();

  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState(membership?.studentId ?? "");
  const [planName, setPlanName] = useState(membership?.planName ?? "");
  const [monthlyPrice, setMonthlyPrice] = useState(
    membership?.monthlyPrice ?? "",
  );
  const [status, setStatus] = useState<MembershipStatus>(
    membership?.status ?? "ACTIVE",
  );
  const [startDate, setStartDate] = useState(toDateInput(membership?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(membership?.endDate));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const studentName =
      studentsQuery.data?.find((s) => s.id === studentId)?.user.name ?? "matrícula";

    const payload = {
      studentId,
      planName,
      monthlyPrice: Number(monthlyPrice),
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    try {
      if (isEditing && membership) {
        const { studentId: _studentId, ...updatePayload } = payload;
        await run(`Salvando ${studentName}...`, (signal) =>
          updateMembership.mutateAsync({
            id: membership.id,
            input: updatePayload,
            signal,
          }),
        );
        toast.success(`Matrícula de ${studentName} foi atualizada com sucesso.`);
      } else {
        await run(`Criando matrícula de ${studentName}...`, (signal) =>
          createMembership.mutateAsync({ ...payload, signal }),
        );
        toast.success(`Matrícula de ${studentName} foi criada com sucesso.`);
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
          ? "Não foi possível atualizar a matrícula."
          : "Não foi possível criar a matrícula.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Modal
      title={isEditing ? "Editar matrícula" : "Nova matrícula"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <label>
          Aluno
          <select
            required
            disabled={isEditing}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Selecione um aluno</option>
            {studentsQuery.data?.map((student) => (
              <option key={student.id} value={student.id}>
                {student.user.name}
              </option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label>
            Plano
            <input
              required
              minLength={2}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ex: Plano Mensal"
            />
          </label>
          <label>
            Valor mensal (R$)
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="Ex: 149.90"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MembershipStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Início
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
        </div>
        <label>
          Fim (opcional)
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
