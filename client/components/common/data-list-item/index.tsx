import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DataListItemProps } from "./data-list-item.types";

export type { DataListItemProps } from "./data-list-item.types";

export const DataListItem = ({
  leading,
  title,
  subtitle,
  trailing,
  trailingAction,
  href,
  onClick,
  showChevron,
}: DataListItemProps) => {
  const withChevron = showChevron ?? Boolean(href);

  const content = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        {subtitle ? (
          <div className="text-muted-foreground mt-0.5 truncate text-xs">
            {subtitle}
          </div>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
      {withChevron ? (
        <ChevronRight
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />
      ) : null}
    </>
  );

  const className =
    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60";

  const clickable = href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );

  if (trailingAction) {
    return (
      <div className="flex w-full items-center">
        <div className="min-w-0 flex-1">{clickable}</div>
        <div className="pr-2">{trailingAction}</div>
      </div>
    );
  }

  return clickable;
};
