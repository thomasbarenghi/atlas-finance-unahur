"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";

export interface ConfirmActionOptions<T> {
  run: (target: T) => Promise<unknown>;
  successMessage: string | ((target: T) => string);
  errorMessage: string;
  onSuccess?: (target: T) => void;
}

export interface ConfirmAction<T> {
  target: T | null;
  isOpen: boolean;
  isPending: boolean;
  request: (target: T) => void;
  clear: () => void;
  confirm: () => void;
}

export const useConfirmAction = <T>({
  run,
  successMessage,
  errorMessage,
  onSuccess,
}: ConfirmActionOptions<T>): ConfirmAction<T> => {
  const [target, setTarget] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);

  const request = useCallback((next: T) => setTarget(next), []);
  const clear = useCallback(() => setTarget(null), []);

  const confirm = useCallback(() => {
    if (target === null) return;
    setIsPending(true);
    void (async () => {
      try {
        await run(target);
        toast.success(
          typeof successMessage === "function"
            ? successMessage(target)
            : successMessage,
        );
        onSuccess?.(target);
      } catch (error) {
        toast.error(getErrorMessage(error, errorMessage));
      } finally {
        setIsPending(false);
        setTarget(null);
      }
    })();
  }, [target, run, successMessage, errorMessage, onSuccess]);

  return {
    target,
    isOpen: target !== null,
    isPending,
    request,
    clear,
    confirm,
  };
};
