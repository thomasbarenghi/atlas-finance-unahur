import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface DetailPageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export interface DetailPageSkeletonProps {
  metricCount?: number;
}

export interface DetailPageNotFoundProps {
  entityLabel: string;
  icon: LucideIcon;
  title: string;
  description: string;
}
