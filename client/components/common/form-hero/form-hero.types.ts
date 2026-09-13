import type { ReactNode } from "react";

export interface FormHeroProps {
  icon: ReactNode;
  label: string;
  helper?: string;
  /** Hex tint used for the gradient background and the label color. */
  accentColor?: string;
  className?: string;
  children?: ReactNode;
}
