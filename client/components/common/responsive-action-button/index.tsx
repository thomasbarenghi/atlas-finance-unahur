"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ResponsiveActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

export const ResponsiveActionButton = ({
  label,
  icon: Icon,
  onClick,
  className,
}: ResponsiveActionButtonProps) => {
  return (
    <Button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "size-10 gap-2 rounded-full px-0 text-[13px] leading-[18px] font-semibold md:h-10 md:w-auto md:px-[18px]",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
};
