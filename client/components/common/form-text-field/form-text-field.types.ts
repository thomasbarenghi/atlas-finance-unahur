import type { ComponentProps } from "react";

export interface FormTextFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: ComponentProps<"input">["type"];
  step?: string | number;
  min?: string | number;
  autoComplete?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
}
