interface LoadingOverlayProps {
  message: string;
  onCancel: () => void;
}

export function LoadingOverlay({ message, onCancel }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{message}</p>
        <button type="button" className="btn-danger" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
