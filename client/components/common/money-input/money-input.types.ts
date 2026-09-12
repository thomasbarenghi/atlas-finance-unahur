export interface MoneyInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  className?: string;
  inputClassName?: string;
}
