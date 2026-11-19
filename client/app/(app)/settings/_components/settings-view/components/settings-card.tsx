import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SettingsCardProps {
  title: string;
  description?: string;
  dense?: boolean;
  children: ReactNode;
}

export const SettingsCard = ({
  title,
  description,
  dense,
  children,
}: SettingsCardProps) => {
  return (
    <section
      className={cn(
        "surface-card flex flex-col",
        dense ? "gap-2.5 p-5" : "gap-4 p-[22px]",
      )}
    >
      <header className="flex flex-col gap-0.5">
        <h2
          className={cn(
            "text-ink font-heading font-semibold",
            dense ? "text-[14px] leading-[18px]" : "text-[15px] leading-[19px]",
          )}
        >
          {title}
        </h2>
        {description ? <p className="card-description">{description}</p> : null}
      </header>
      {children}
    </section>
  );
};
