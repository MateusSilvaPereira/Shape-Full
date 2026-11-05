import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Building2, Camera, Loader2, Palette } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeading } from "@/components/layout/PageHeading";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { validateAvatarFile } from "@/lib/avatarUpload";
import * as settingsApi from "./api";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN"];

export function SettingsPage() {
  const { user, updateAcademy } = useAuth();
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const academyQuery = useQuery({
    queryKey: ["academy-settings"],
    queryFn: ({ signal }) => settingsApi.getMyAcademy(signal),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6b2fa3");
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (academyQuery.data) {
      setName(academyQuery.data.name);
      setEmail(academyQuery.data.email ?? "");
      setPhone(academyQuery.data.phone ?? "");
      setPrimaryColor(academyQuery.data.primaryColor);
    }
  }, [academyQuery.data]);

  function handleLogoClick() {
    fileInputRef.current?.click();
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    setUploadingLogo(true);
    try {
      const updated = await run("Enviando logo...", (signal) =>
        settingsApi.uploadAcademyLogo(file, signal),
      );
      queryClient.setQueryData(["academy-settings"], updated);
      updateAcademy(updated);
      toast.success("Logo da academia atualizada com sucesso.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Envio cancelado.");
      } else {
        toast.error(getApiErrorMessage(err, "Não foi possível enviar a logo."));
      }
    } finally {
      setUploadingLogo(false);
      URL.revokeObjectURL(localPreview);
      setLogoPreview(null);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const updated = await run("Salvando configurações...", (signal) =>
        settingsApi.updateMyAcademy({ name, email, phone, primaryColor }, signal),
      );
      queryClient.setQueryData(["academy-settings"], updated);
      updateAcademy(updated);
      toast.success("Configurações da academia atualizadas com sucesso.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
      } else {
        toast.error(
          getApiErrorMessage(err, "Não foi possível salvar as configurações."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveSettings();
  }

  const displayLogo = logoPreview ?? resolveAssetUrl(academyQuery.data?.logoUrl);

  return (
    <>
      <PageHeading
        title="Configurações"
        subtitle="Gerencie a identidade e os dados da sua academia."
      />

      <div className="profile-grid">
        <section className="panel profile-card">
          {academyQuery.isLoading ? (
            <>
              <Skeleton width={96} height={96} radius={18} />
              <Skeleton width="70%" height={14} className="skeleton-block" />
            </>
          ) : (
            <>
              <div className="profile-avatar-wrap">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt={academyQuery.data?.name}
                    className="profile-avatar-img settings-logo-img"
                  />
                ) : (
                  <div
                    className="avatar admin"
                    style={{ width: 96, height: 96, borderRadius: 18, fontSize: 30 }}
                  >
                    <Building2 size={34} />
                  </div>
                )}
                {canManage && (
                  <button
                    type="button"
                    className="profile-avatar-edit"
                    onClick={handleLogoClick}
                    disabled={uploadingLogo}
                    title="Alterar logo"
                  >
                    {uploadingLogo ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Camera size={15} />
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={handleLogoChange}
                />
              </div>
              <h2>{academyQuery.data?.name}</h2>
              <p className="profile-email">/{academyQuery.data?.slug}</p>
              <div className="profile-badges">
                <span>{academyQuery.data?.status === "ACTIVE" ? "Ativa" : academyQuery.data?.status}</span>
              </div>
            </>
          )}
        </section>

        <div className="profile-forms">
          <section className="panel">
            <div className="panel-head">
              <div className="panel-head-title">
                <span className="panel-icon">
                  <Building2 size={14} />
                </span>
                <div>
                  <h3>Dados da academia</h3>
                  <p>Essas informações aparecem no sistema e na tela de login.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="profile-form">
              <label>
                Nome da academia
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManage}
                />
              </label>
              <div className="form-row">
                <label>
                  E-mail de contato
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canManage}
                  />
                </label>
                <label>
                  Telefone
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canManage}
                  />
                </label>
              </div>
              {canManage && (
                <div className="modal-actions">
                  <button className="btn-primary" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              )}
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="panel-head-title">
                <span className="panel-icon">
                  <Palette size={14} />
                </span>
                <div>
                  <h3>Cor da marca</h3>
                  <p>O sistema inteiro se adapta automaticamente a essa cor.</p>
                </div>
              </div>
            </div>
            <div className="color-picker-row">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!canManage}
                className="color-swatch-input"
              />
              <div>
                <b>{primaryColor.toUpperCase()}</b>
                <small>Clique no quadrado para escolher uma nova cor</small>
              </div>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={saveSettings}
                >
                  Aplicar cor
                </button>
              )}
            </div>
          </section>

          {!canManage && (
            <p className="settings-readonly-note">
              Apenas administradores podem editar as configurações da academia.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
