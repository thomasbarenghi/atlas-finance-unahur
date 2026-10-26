import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const TONE: Record<IconBadgeTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

const SIZE: Record<IconBadgeSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

const ICON_SIZE: Record<IconBadgeSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const SHAPE: Record<IconBadgeShape, string> = {
  full: "rounded-full",
  xl: "rounded-xl",
  lg: "rounded-lg",
};

export const IconBadge = ({
  icon: Icon,
  tone = "primary",
  size = "md",
  shape = "full",
  className,
}: IconBadgeProps) => {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        TONE[tone],
        SIZE[size],
        SHAPE[shape],
        className,
      )}
    >
      <Icon className={cn(ICON_SIZE[size])} aria-hidden />
    </span>
  );
};
