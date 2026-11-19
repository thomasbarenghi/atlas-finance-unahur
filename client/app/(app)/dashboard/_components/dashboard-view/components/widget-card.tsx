import type { ReactNode } from "react";

export interface WidgetCardProps {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}

export const WidgetCard = ({ title, hint, children }: WidgetCardProps) => {
  return (
    <div className="bg-card border-line flex h-full flex-col overflow-hidden rounded-[20px] border px-4 pt-3.5 pb-3.5 md:h-[336px] md:rounded-[24px] md:px-[22px] md:pt-5">
      <div className="flex flex-col gap-px md:gap-0.5">
        <h3 className="text-foreground truncate text-[14px] leading-[18px] font-semibold md:text-[15px] md:leading-[19px]">
          {title}
        </h3>
        {hint ? (
          <p className="text-muted-foreground truncate text-[10.5px] leading-[14px] md:text-[11.5px] md:leading-[16px]">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="mt-1.5 flex-1 md:mt-1.5">{children}</div>
    </div>
  );
};
