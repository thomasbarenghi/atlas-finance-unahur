import type { ConfirmAction } from "@/hooks/use-confirm-action";

export type ConfirmActionValue<T, R> = R | ((target: T) => R);

export interface ConfirmActionDialogProps<T> {
  action: ConfirmAction<T>;
  title: ConfirmActionValue<T, string>;
  description: ConfirmActionValue<T, string>;
  confirmLabel?: ConfirmActionValue<T, string>;
  variant?: ConfirmActionValue<T, "default" | "destructive">;
}
