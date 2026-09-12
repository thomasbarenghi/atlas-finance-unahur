"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { IconBadge } from "@/components/common/icon-badge";

export interface ListRowProps {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  href?: string;
  onClick?: () => void;
}

export const ListRow = ({
  icon: Icon,
  label,
  value,
  href,
  onClick,
}: ListRowProps) => {
  const content = (
    <>
      <IconBadge icon={Icon} size="sm" shape="lg" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? (
        <span className="text-muted-foreground text-sm">{value}</span>
      ) : null}
      <ChevronRight className="text-muted-foreground size-4" aria-hidden />
    </>
  );

  const className =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};
