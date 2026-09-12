import type { LucideIcon } from "lucide-react";

export interface OptionPickerOption<T extends string = string> {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface OptionPickerDialogProps<T extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  options: OptionPickerOption<T>[];
  layout?: "cards" | "rows";
  onSelect: (value: T) => void;
}
