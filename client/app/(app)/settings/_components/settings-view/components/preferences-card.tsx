"use client";

import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { SegmentedControl } from "@/components/common/segmented-control";
import { THEMES, type ThemePreference } from "../themes";
import { SettingsCard } from "./settings-card";

interface PreferenceRowProps {
  title: string;
  description: string;
  children: ReactNode;
}

const PreferenceRow = ({
  title,
  description,
  children,
}: PreferenceRowProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-px">
      <span className="text-ink2 text-[12.5px] leading-[17px] font-semibold">
        {title}
      </span>
      <span className="text-muted-foreground text-[10.5px] leading-[14px]">
        {description}
      </span>
    </div>
    {children}
  </div>
);

export const PreferencesCard = () => {
  const { theme, setTheme } = useTheme();
  const value = (theme ?? "light") as ThemePreference;

  return (
    <SettingsCard
      title="Preferencias"
      description="Apariencia de la aplicación."
    >
      <PreferenceRow title="Tema" description="Claro, oscuro o el del sistema">
        <SegmentedControl
          options={THEMES}
          value={value}
          onChange={setTheme}
          ariaLabel="Tema"
        />
      </PreferenceRow>
    </SettingsCard>
  );
};
