import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import { getApiErrorMessage } from "./apiClient";

/** Dispara um toast de erro uma única vez quando uma query entra em estado de erro. */
export function useErrorToast(isError: boolean, error: unknown, fallback: string) {
  const { toast } = useToast();
  const notified = useRef(false);

  useEffect(() => {
    if (isError && !notified.current) {
      toast.error(getApiErrorMessage(error, fallback));
      notified.current = true;
    }
    if (!isError) notified.current = false;
  }, [isError, error, fallback, toast]);
}
