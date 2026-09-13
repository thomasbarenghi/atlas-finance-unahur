import type { LucideIcon } from "lucide-react";

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "destructive";
  hidden?: boolean;
}

export interface RowActionsMenuProps {
  label: string;
  actions: RowAction[];
  triggerLabel?: string;
}
