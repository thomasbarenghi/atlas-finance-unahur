import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BackButton } from "./components/back-button";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  titleAddon?: ReactNode;
  titleSize?: "default" | "compact";
}

export const PageHeader = ({
  title,
  description,
  actions,
  titleAddon,
  titleSize = "default",
}: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BackButton />
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <div className="flex min-w-0 items-center gap-2">
              <h1
                className={cn(
                  "font-heading text-foreground font-semibold tracking-[-0.7px] md:text-[30px] md:leading-[38px]",
                  titleSize === "compact"
                    ? "text-[20px] leading-[25px]"
                    : "text-[26px] leading-[33px]",
                )}
              >
                {title}
              </h1>
              {titleAddon}
            </div>
            {description ? (
              <p className="text-muted-foreground text-[11px] leading-[15px] md:text-[12.5px] md:leading-[17px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
};
