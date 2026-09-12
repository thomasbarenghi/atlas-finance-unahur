import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WarningBadgeProps } from "./warning-badge.types";

export const WarningBadge = ({
  label,
  detail,
  className,
}: WarningBadgeProps) => {
  return (
    <span
      className={cn(
        "bg-warning/10 text-warning flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
      title={detail}
    >
      <TriangleAlert className="size-3.5" aria-hidden />
      {label}
    </span>
  );
};
