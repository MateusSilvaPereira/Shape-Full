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
  useCreateProfessional,
  useUpdateProfessional,
  useUploadProfessionalAvatar,
} from "./useProfessionals";
import type { CreateProfessionalResult, Professional, StaffRole } from "./types";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "ACADEMY_ADMIN", label: "Administrador" },
  { value: "TRAINER", label: "Treinador" },
  { value: "NUTRITIONIST", label: "Nutricionista" },
  { value: "RECEPTIONIST", label: "Recepção" },
];

interface ProfessionalFormModalProps {
  professional?: Professional;
  onClose: () => void;
}

export function ProfessionalFormModal({
  professional,
  onClose,
}: ProfessionalFormModalProps) {
  const isEditing = Boolean(professional);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const uploadAvatar = useUploadProfessionalAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [name, setName] = useState(professional?.name ?? "");
  const [email, setEmail] = useState(professional?.email ?? "");
  const [phone, setPhone] = useState(professional?.phone ?? "");
  const [role, setRole] = useState<StaffRole>(professional?.role ?? "TRAINER");
  const [avatarUrl, setAvatarUrl] = useState(professional?.avatarUrl ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [creationResult, setCreationResult] = useState<CreateProfessionalResult | null>(null);

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !professional) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    try {
      const updated = await run(`Enviando foto de ${name}...`, (signal) =>
        uploadAvatar.mutateAsync({ id: professional.id, file, signal }),
      );
      setAvatarUrl(updated.avatarUrl);
      toast.success(`Foto de ${name} atualizada com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Envio cancelado.");
      } else {
        toast.error(getApiErrorMessage(err, "Não foi possível enviar a foto."));
      }
    } finally {
      URL.revokeObjectURL(localPreview);
      setAvatarPreview(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (isEditing && professional) {
        await run(`Salvando ${name}...`, (signal) =>
          updateProfessional.mutateAsync({
            id: professional.id,
            input: { name, phone: phone || undefined, role },
            signal,
          }),
        );
        toast.success(`Dados de ${name} atualizados com sucesso.`);
        onClose();
      } else {
        const result = await run(`Cadastrando ${name}...`, (signal) =>
          createProfessional.mutateAsync({
            name,
            email,
            phone: phone || undefined,
            role,
            signal,
          }),
        );
        toast.success(`${name} foi cadastrado com sucesso.`);
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
          ? "Não foi possível atualizar o profissional."
          : "Não foi possível cadastrar o profissional.",
      );
      setError(message);
      toast.error(message);
    }
  }

  const displayAvatar = avatarPreview ?? resolveAssetUrl(avatarUrl);

  if (creationResult) {
    return (
      <Modal title="Profissional cadastrado" onClose={onClose}>
        {creationResult.emailSent ? (
          <Alert variant="success">
            <b>{name}</b> foi cadastrado com sucesso e recebeu um e-mail em <b>{email}</b>{" "}
            com o login e a senha temporária de primeiro acesso.
          </Alert>
        ) : (
          <Alert variant="warning">
            <b>{name}</b> foi cadastrado, mas não foi possível enviar o e-mail de
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
    <Modal
      title={isEditing ? "Editar profissional" : "Novo profissional"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {isEditing && (
          <div className="profile-avatar-wrap" style={{ alignSelf: "center" }}>
            {displayAvatar ? (
              <img src={displayAvatar} alt={name} className="profile-avatar-img" />
            ) : (
              <div className="avatar admin" style={{ width: 96, height: 96, fontSize: 30 }}>
                <User size={34} />
              </div>
            )}
            <button
              type="button"
              className="profile-avatar-edit"
              onClick={handleAvatarClick}
              disabled={uploadAvatar.isPending}
              title="Alterar foto"
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
        )}
        <label>
          Nome completo
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="form-row">
          <label>
            E-mail
            <input
              type="email"
              required
              disabled={isEditing}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Telefone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <label>
          Função
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
