import type { ReactNode } from "react";

export interface LinkedEntityCardProps {
  label: string;
  title: string;
  amount: number;
  currency: string;
  href: string;
  trailing?: ReactNode;
}
