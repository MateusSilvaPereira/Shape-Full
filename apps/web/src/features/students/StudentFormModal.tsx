import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { validateAvatarFile } from "@/lib/avatarUpload";
import {
  useCreateStudent,
  useUpdateStudent,
  useUploadStudentAvatar,
} from "./useStudents";
import type { CreateStudentResult, Gender, Student } from "./types";

interface StudentFormModalProps {
  student?: Student;
  onClose: () => void;
}

export function StudentFormModal({ student, onClose }: StudentFormModalProps) {
  const isEditing = Boolean(student);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const uploadAvatar = useUploadStudentAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [creationResult, setCreationResult] = useState<CreateStudentResult | null>(null);

  const [avatarUrl, setAvatarUrl] = useState(student?.user.avatarUrl ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: student?.user.name ?? "",
    email: student?.user.email ?? "",
    phone: student?.user.phone ?? "",
    birthDate: student?.birthDate?.slice(0, 10) ?? "",
    gender: (student?.gender ?? "") as Gender | "",
    heightCm: student?.heightCm?.toString() ?? "",
    goal: student?.goal ?? "",
    planName: student?.memberships[0]?.planName ?? "",
    monthlyPrice: student?.memberships[0]?.monthlyPrice ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    if (isEditing && student) {
      try {
        const updated = await run(`Enviando foto de ${student.user.name}...`, (signal) =>
          uploadAvatar.mutateAsync({ id: student.id, file, signal }),
        );
        setAvatarUrl(updated.user.avatarUrl);
        toast.success(`Foto de ${form.name} atualizada com sucesso.`);
      } catch (err) {
        if (err instanceof ActionCanceledError) {
          toast.info("Envio da foto cancelado.");
        } else {
          toast.error(getApiErrorMessage(err, "Não foi possível enviar a foto."));
        }
      } finally {
        URL.revokeObjectURL(localPreview);
        setAvatarPreview(null);
      }
    } else {
      setPendingAvatarFile(file);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      name: form.name,
      phone: form.phone || undefined,
      birthDate: form.birthDate || undefined,
      gender: form.gender || undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      goal: form.goal || undefined,
    };
    try {
      if (isEditing && student) {
        await run(`Salvando dados de ${form.name}...`, (signal) =>
          updateStudent.mutateAsync({ id: student.id, input: payload, signal }),
        );
        toast.success(`Dados de ${form.name} atualizados com sucesso.`);
        onClose();
      } else {
        const result = await run(`Cadastrando ${form.name}...`, (signal) =>
          createStudent.mutateAsync({
            ...payload,
            email: form.email,
            planName: form.planName || undefined,
            monthlyPrice: form.monthlyPrice
              ? Number(form.monthlyPrice)
              : undefined,
            signal,
          }),
        );
        toast.success(`${form.name} foi cadastrado com sucesso.`);

        if (pendingAvatarFile) {
          try {
            await run(`Enviando foto de ${form.name}...`, (signal) =>
              uploadAvatar.mutateAsync({
                id: result.student.id,
                file: pendingAvatarFile,
                signal,
              }),
            );
            toast.success("Foto do aluno adicionada com sucesso.");
          } catch (err) {
            if (err instanceof ActionCanceledError) {
              toast.info("Envio da foto cancelado.");
            } else {
              toast.error(
                getApiErrorMessage(
                  err,
                  "Aluno cadastrado, mas não foi possível enviar a foto.",
                ),
              );
            }
          }
        }

        setCreationResult(result);
      }
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      const message = getApiErrorMessage(
        err,
        isEditing
          ? "Não foi possível atualizar os dados do aluno."
          : "Não foi possível cadastrar o aluno.",
      );
      setError(message);
      toast.error(message);
    }
  }

  const displayAvatar = avatarPreview ?? resolveAssetUrl(avatarUrl);

  if (creationResult) {
    return (
      <Modal title="Aluno cadastrado" onClose={onClose}>
        {creationResult.emailSent ? (
          <Alert variant="success">
            <b>{form.name}</b> foi cadastrado com sucesso e recebeu um e-mail em{" "}
            <b>{form.email}</b> com o login e a senha temporária de primeiro acesso.
          </Alert>
        ) : (
          <Alert variant="warning">
            <b>{form.name}</b> foi cadastrado, mas não foi possível enviar o e-mail de
            boas-vindas. Compartilhe a senha temporária abaixo manualmente — ela não será
            mostrada novamente:
          </Alert>
        )}
        {!creationResult.emailSent && (
          <div className="temp-password-box">
            <code>{creationResult.tempPassword}</code>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Concluir
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={isEditing ? "Editar aluno" : "Novo aluno"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="profile-avatar-wrap" style={{ alignSelf: "center" }}>
          {displayAvatar ? (
            <img src={displayAvatar} alt={form.name} className="profile-avatar-img" />
          ) : (
            <div
              className="avatar admin"
              style={{ width: 96, height: 96, fontSize: 30 }}
            >
              <User size={34} />
            </div>
          )}
          <button
            type="button"
            className="profile-avatar-edit"
            onClick={handleAvatarClick}
            disabled={uploadAvatar.isPending}
            title="Adicionar foto"
          >
            {uploadAvatar.isPending ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <Camera size={15} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleAvatarChange}
          />
        </div>
        <label>
          Nome completo
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            required
            disabled={isEditing}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Telefone
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
          <label>
            Nascimento
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Gênero
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as Gender)}
            >
              <option value="">Não informado</option>
              <option value="FEMALE">Feminino</option>
              <option value="MALE">Masculino</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>
          <label>
            Altura (cm)
            <input
              type="number"
              value={form.heightCm}
              onChange={(e) => update("heightCm", e.target.value)}
            />
          </label>
        </div>
        <label>
          Objetivo
          <input
            value={form.goal}
            onChange={(e) => update("goal", e.target.value)}
            placeholder="Ex: emagrecimento, hipertrofia..."
          />
        </label>
        {!isEditing && (
          <div className="form-row">
            <label>
              Plano
              <input
                value={form.planName}
                onChange={(e) => update("planName", e.target.value)}
                placeholder="Ex: Plano Mensal"
              />
            </label>
            <label>
              Valor mensal (R$)
              <input
                type="number"
                step="0.01"
                value={form.monthlyPrice}
                onChange={(e) => update("monthlyPrice", e.target.value)}
              />
            </label>
          </div>
        )}
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
