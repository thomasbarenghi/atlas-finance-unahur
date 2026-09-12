import type { LucideIcon } from "lucide-react";

export type IconBadgeTone = "primary" | "success" | "destructive" | "muted";
export type IconBadgeSize = "sm" | "md" | "lg";
export type IconBadgeShape = "full" | "xl" | "lg";

export interface IconBadgeProps {
  icon: LucideIcon;
  tone?: IconBadgeTone;
  size?: IconBadgeSize;
  shape?: IconBadgeShape;
  className?: string;
}
