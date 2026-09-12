export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  options: FormSelectOption[];
  disabled?: boolean;
}
