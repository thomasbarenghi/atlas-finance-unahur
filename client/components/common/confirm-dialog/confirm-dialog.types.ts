import type { ReactNode } from "react";

export interface ConfirmDialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}
