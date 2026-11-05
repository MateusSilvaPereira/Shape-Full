import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { isCanceledError } from "@/lib/apiClient";
import { LoadingOverlay } from "./LoadingOverlay";

export class ActionCanceledError extends Error {
  constructor() {
    super("Ação cancelada pelo usuário.");
    this.name = "ActionCanceledError";
  }
}

interface OverlayState {
  message: string;
}

interface LoadingOverlayContextValue {
  /** Executa uma tarefa assíncrona mostrando um overlay central cancelável. */
  run: <T>(message: string, task: (signal: AbortSignal) => Promise<T>) => Promise<T>;
}

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

// Tempo mínimo que o overlay fica visível: em requisições muito rápidas (ex: localhost),
// sem isso ele apareceria e sumiria tão rápido que pareceria não estar funcionando.
const MIN_VISIBLE_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async <T,>(message: string, task: (signal: AbortSignal) => Promise<T>): Promise<T> => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ message });

      // Garante que clicar em "Cancelar" sempre responde na hora, mesmo que a
      // tarefa em si (ex: uma ação local, sem rede) não escute o AbortSignal.
      const whenAborted = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new ActionCanceledError()),
        );
      });

      try {
        const work = (async () => {
          const [result] = await Promise.all([
            task(controller.signal),
            wait(MIN_VISIBLE_MS),
          ]);
          return result;
        })();
        // Evita um "unhandled rejection" quando a corrida é vencida pelo cancelamento.
        work.catch(() => {});
        return await Promise.race([work, whenAborted]);
      } catch (err) {
        if (err instanceof ActionCanceledError) throw err;
        if (isCanceledError(err)) throw new ActionCanceledError();
        throw err;
      } finally {
        setState(null);
        controllerRef.current = null;
      }
    },
    [],
  );

  function handleCancel() {
    controllerRef.current?.abort();
  }

  const value = useMemo(() => ({ run }), [run]);

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      {state && <LoadingOverlay message={state.message} onCancel={handleCancel} />}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  const ctx = useContext(LoadingOverlayContext);
  if (!ctx)
    throw new Error("useLoadingOverlay deve ser usado dentro de LoadingOverlayProvider");
  return ctx;
}
