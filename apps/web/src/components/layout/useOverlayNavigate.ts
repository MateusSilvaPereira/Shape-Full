import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";

/** Navega para outra rota mostrando o overlay de carregamento com o nome do destino. */
export function useOverlayNavigate() {
  const navigate = useNavigate();
  const { run } = useLoadingOverlay();

  return useCallback(
    async (path: string, label: string) => {
      try {
        await run(`Abrindo ${label}...`, () => Promise.resolve());
        navigate(path);
      } catch (err) {
        if (!(err instanceof ActionCanceledError)) throw err;
      }
    },
    [navigate, run],
  );
}
