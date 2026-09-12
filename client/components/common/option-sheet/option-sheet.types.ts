export interface OptionSheetOption {
  value: string;
  label: string;
}

export interface OptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: OptionSheetOption[];
  value: string;
  onSelect: (value: string) => void;
}
