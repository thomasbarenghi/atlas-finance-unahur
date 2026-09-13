export type InvestmentCreationType = "asset" | "position" | "debt";

export interface InvestmentTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: InvestmentCreationType) => void;
}
