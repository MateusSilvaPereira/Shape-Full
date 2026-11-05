import { Modal } from "@/components/ui/Modal";
import type { ConfirmOptions } from "./types";

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ options, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={options.title} onClose={onCancel}>
      <p className="confirm-message">{options.message}</p>
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {options.cancelLabel ?? "Cancelar"}
        </button>
        <button
          type="button"
          className={options.danger ? "btn-danger" : "btn-primary"}
          onClick={onConfirm}
        >
          {options.confirmLabel ?? "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
