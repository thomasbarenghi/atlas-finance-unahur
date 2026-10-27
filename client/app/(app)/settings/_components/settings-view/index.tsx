"use client";

import { Check, Loader2 } from "lucide-react";
import { FormShell } from "@/components/common/form-shell";
import { PRIMARY_ACTION_BUTTON } from "@/components/common/ui-classes";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { MobileSettings } from "./components/mobile-settings";
import { PasswordCard } from "./components/password-card";
import { PreferencesCard } from "./components/preferences-card";
import { ProfileCard } from "./components/profile-card";
import { CurrenciesCard } from "./components/currencies-card";
import { SideSettings } from "./components/side-settings";
import { useSettingsForm } from "./hooks/use-settings-form";

export const SettingsView = () => {
  const { user, form, onSubmit, isPending, isDirty } = useSettingsForm();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-3.5">
        <PageHeader title="Ajustes" description="Perfil y preferencias" />
        <MobileSettings />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-[18px]">
      <PageHeader
        title="Ajustes"
        description="Tu perfil, preferencias y datos"
        actions={
          <Button
            type="submit"
            form="settings-form"
            disabled={!isDirty || isPending}
            className={cn(
              PRIMARY_ACTION_BUTTON,
              "disabled:bg-primary/60 disabled:opacity-100",
            )}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            Guardar cambios
          </Button>
        }
      />

      <div className="grid items-start gap-[22px] lg:grid-cols-[720fr_358fr]">
        <div className="flex flex-col gap-[18px]">
          <FormShell
            id="settings-form"
            form={form}
            onSubmit={onSubmit}
            className="gap-0"
          >
            <ProfileCard user={user} />
          </FormShell>
          <PasswordCard />
          <PreferencesCard />
          <CurrenciesCard />
        </div>
        <SideSettings />
      </div>
    </div>
  );
};
