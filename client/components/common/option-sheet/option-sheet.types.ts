export interface OptionSheetOption<T extends string = string> {
  value: T;
  label: string;
}

export interface OptionSheetProps<T extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: OptionSheetOption<T>[];
  value: T;
  onSelect: (value: T) => void;
}
