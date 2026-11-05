import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ToastItem, ToastVariant } from "./types";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport">
      {toasts.map((item) => {
        const Icon = ICONS[item.variant];
        return (
          <div key={item.id} className={"toast-item " + item.variant}>
            <Icon size={17} className="toast-icon" />
            <span>{item.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(item.id)}
              aria-label="Fechar notificação"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
