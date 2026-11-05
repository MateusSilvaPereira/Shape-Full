import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, KeyRound, Loader2, User } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import { validateAvatarFile } from "@/lib/avatarUpload";
import * as profileApi from "./api";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ACADEMY_ADMIN: "Administrador",
  TRAINER: "Treinador",
  NUTRITIONIST: "Nutricionista",
  RECEPTIONIST: "Recepção",
  STUDENT: "Aluno",
};

export function ProfilePage() {
  const { user, academy, updateUser } = useAuth();
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) return null;

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
    setPreviewUrl(localPreview);
    setUploadingAvatar(true);
    try {
      const updated = await run("Enviando foto de perfil...", (signal) =>
        profileApi.uploadAvatar(file, signal),
      );
      updateUser(updated);
      toast.success("Foto de perfil atualizada com sucesso.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Envio da foto cancelado.");
      } else {
        toast.error(getApiErrorMessage(err, "Não foi possível enviar a foto."));
      }
    } finally {
      setUploadingAvatar(false);
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    }
  }

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await run("Salvando perfil...", (signal) =>
        profileApi.updateProfile({ name, phone }, signal),
      );
      updateUser(updated);
      toast.success("Perfil atualizado com sucesso.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
      } else {
        toast.error(getApiErrorMessage(err, "Não foi possível atualizar o perfil."));
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação de senha não corresponde à nova senha.");
      return;
    }
    setChangingPassword(true);
    try {
      await run("Atualizando senha...", (signal) =>
        profileApi.changePassword({ currentPassword, newPassword }, signal),
      );
      toast.success("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
      } else {
        toast.error(
          getApiErrorMessage(err, "Não foi possível alterar a senha."),
        );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <>
      <PageHeading title="Meu perfil" subtitle="Gerencie seus dados pessoais e de acesso." />

      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-avatar-wrap">
            {previewUrl ? (
              <img src={previewUrl} alt={name} className="profile-avatar-img" />
            ) : (
              <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={96} />
            )}
            <button
              type="button"
              className="profile-avatar-edit"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              title="Alterar foto"
            >
              {uploadingAvatar ? (
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
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="profile-badges">
            <span>{ROLE_LABELS[user.role] ?? user.role}</span>
            {academy && <span>{academy.name}</span>}
          </div>
        </section>

        <div className="profile-forms">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>
                  <User size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Dados pessoais
                </h3>
                <p>Essas informações aparecem no sistema para sua equipe.</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <label>
                Nome completo
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  E-mail
                  <input value={user.email} disabled />
                </label>
                <label>
                  Telefone
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>
                  <KeyRound size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Alterar senha
                </h3>
                <p>Use uma senha com pelo menos 8 caracteres.</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <label>
                Senha atual
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  Nova senha
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirmar nova senha
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn-primary" disabled={changingPassword}>
                  {changingPassword ? "Atualizando..." : "Atualizar senha"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
