import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ImagePlus } from "lucide-react";
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
  useCreateBanner,
  useUpdateBanner,
  useUpdateBannerImage,
} from "./useBanners";
import type { Banner } from "./types";

interface BannerFormModalProps {
  banner?: Banner;
  onClose: () => void;
}

export function BannerFormModal({ banner, onClose }: BannerFormModalProps) {
  const isEditing = Boolean(banner);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const updateBannerImage = useUpdateBannerImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [title, setTitle] = useState(banner?.title ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [order, setOrder] = useState(String(banner?.order ?? 0));
  const [active, setActive] = useState(banner?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    banner ? resolveAssetUrl(banner.imageUrl) : null,
  );

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    const validationError = validateAvatarFile(selected);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!isEditing && !file) {
      setError("Selecione uma imagem para o banner.");
      return;
    }

    const meta = {
      title,
      linkUrl: linkUrl || undefined,
      order: order ? Number(order) : 0,
      active,
    };

    try {
      if (isEditing && banner) {
        await run(`Salvando ${title}...`, async (signal) => {
          await updateBanner.mutateAsync({ id: banner.id, input: meta, signal });
          if (file) {
            await updateBannerImage.mutateAsync({ id: banner.id, file, signal });
          }
        });
        toast.success(`${title} foi atualizado com sucesso.`);
      } else {
        await run(`Criando ${title}...`, (signal) =>
          createBanner.mutateAsync({ file: file as File, meta, signal }),
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
          ? "Não foi possível atualizar o banner."
          : "Não foi possível criar o banner.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Modal title={isEditing ? "Editar banner" : "Novo banner"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="banner-image-picker"
          onClick={handlePickFile}
        >
          {preview ? (
            <img src={preview} alt="Pré-visualização do banner" />
          ) : (
            <span>
              <ImagePlus size={20} />
              Selecionar imagem
            </span>
          )}
          <div className="banner-image-picker-overlay">
            <ImagePlus size={16} /> Trocar imagem
          </div>
        </button>

        <label>
          Título
          <input
            required
            minLength={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Promoção de verão"
          />
        </label>

        <label>
          Link (opcional)
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <div className="form-row">
          <label>
            Ordem de exibição
            <input
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={active ? "true" : "false"}
              onChange={(e) => setActive(e.target.value === "true")}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
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
