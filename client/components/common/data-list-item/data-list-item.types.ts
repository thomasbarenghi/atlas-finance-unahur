import type { ReactNode } from "react";

export interface DataListItemProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  trailingAction?: ReactNode;
  href?: string;
  onClick?: () => void;
  showChevron?: boolean;
}
