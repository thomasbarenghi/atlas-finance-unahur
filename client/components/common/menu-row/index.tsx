"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "destructive";
  bordered?: boolean;
  disabled?: boolean;
}

export const MenuRow = ({
  icon: Icon,
  label,
  href,
  onClick,
  tone = "default",
  bordered,
  disabled,
}: MenuRowProps) => {
  const content = (
    <>
      <Icon
        className={cn("size-4", tone === "default" && "text-muted-foreground")}
        aria-hidden
      />
      <span className="flex-1">{label}</span>
      {href ? (
        <ChevronRight
          className="text-muted-foreground size-[14px]"
          aria-hidden
        />
      ) : null}
    </>
  );

  const rowClassName = cn(
    "list-row hover:bg-muted/40",
    bordered && "border-line2 border-b",
    tone === "destructive" &&
      "text-expense hover:bg-destructive/5 font-semibold",
    disabled && "opacity-60",
  );

  if (href) {
    return (
      <Link href={href} className={rowClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={rowClassName}
    >
      {content}
    </button>
  );
};
