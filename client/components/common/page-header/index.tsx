import type { ReactNode } from "react";
import { BackButton } from "@/components/common/back-button";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({
  title,
  description,
  actions,
}: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="font-heading min-w-0 flex-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-muted-foreground hidden text-sm md:block">
          {description}
        </p>
      ) : null}
    </div>
  );
};
