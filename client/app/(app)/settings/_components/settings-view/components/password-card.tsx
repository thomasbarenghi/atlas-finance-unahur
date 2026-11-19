"use client";

import { Loader2 } from "lucide-react";
import { FormShell } from "@/components/common/form-shell";
import { FormTextField } from "@/components/common/form-text-field";
import { PRIMARY_ACTION_BUTTON } from "@/components/common/ui-classes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChangePasswordForm } from "../hooks/use-change-password-form";
import { SettingsCard } from "./settings-card";

export const PasswordCard = () => {
  const { form, onSubmit, isPending } = useChangePasswordForm();

  return (
    <SettingsCard
      title="Contraseña"
      description="Cambiala ingresando tu contraseña actual."
    >
      <FormShell form={form} onSubmit={onSubmit} className="gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <FormTextField
            name="currentPassword"
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña actual"
            className="h-10"
          />
          <FormTextField
            name="newPassword"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Tu nueva contraseña"
            className="h-10"
          />
          <FormTextField
            name="confirmPassword"
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Repetí la nueva contraseña"
            className="h-10"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending}
          className={cn(PRIMARY_ACTION_BUTTON, "w-full sm:w-fit")}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Actualizar contraseña
        </Button>
      </FormShell>
    </SettingsCard>
  );
};
