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
import { validateExerciseImageFile } from "@/lib/avatarUpload";
import {
  useCreateExercise,
  useUpdateExercise,
  useUploadExerciseImage,
} from "./useExercises";
import type { Exercise } from "./types";

interface ExerciseFormModalProps {
  exercise?: Exercise;
  onClose: () => void;
}

export function ExerciseFormModal({ exercise, onClose }: ExerciseFormModalProps) {
  const isEditing = Boolean(exercise);
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const uploadImage = useUploadExerciseImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [name, setName] = useState(exercise?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? "");
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "");
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    exercise ? resolveAssetUrl(exercise.imageUrl) : null,
  );

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    const validationError = validateExerciseImageFile(selected);
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
    const payload = {
      name,
      muscleGroup,
      instructions: instructions || undefined,
      videoUrl: videoUrl || undefined,
    };
    try {
      if (isEditing && exercise) {
        await run(`Salvando ${name}...`, async (signal) => {
          await updateExercise.mutateAsync({ id: exercise.id, input: payload, signal });
          if (file) {
            await uploadImage.mutateAsync({ id: exercise.id, file, signal });
          }
        });
        toast.success(`${name} foi atualizado com sucesso.`);
      } else {
        await run(`Cadastrando ${name}...`, async (signal) => {
          const created = await createExercise.mutateAsync({ ...payload, signal });
          if (file) {
            await uploadImage.mutateAsync({ id: created.id, file, signal });
          }
        });
        toast.success(`${name} foi cadastrado com sucesso.`);
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
          ? "Não foi possível atualizar o exercício."
          : "Não foi possível cadastrar o exercício.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Modal title={isEditing ? "Editar exercício" : "Novo exercício"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="banner-image-picker exercise-image-picker"
          onClick={handlePickFile}
        >
          {preview ? (
            <img src={preview} alt="Pré-visualização do exercício" />
          ) : (
            <span>
              <ImagePlus size={20} />
              Foto ou GIF do movimento
            </span>
          )}
          <div className="banner-image-picker-overlay">
            <ImagePlus size={16} /> {preview ? "Trocar imagem" : "Selecionar imagem"}
          </div>
        </button>

        <div className="form-row">
          <label>
            Nome do exercício
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Supino reto" />
          </label>
          <label>
            Grupo muscular
            <input
              required
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              placeholder="Ex: Peito"
            />
          </label>
        </div>
        <label>
          Instruções de execução
          <input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Como executar corretamente"
          />
        </label>
        <label>
          Link do vídeo (opcional)
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
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
