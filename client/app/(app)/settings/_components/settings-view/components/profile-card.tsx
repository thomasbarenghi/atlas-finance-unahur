"use client";

import { Lock } from "lucide-react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/common/ui-classes";
import { FormTextField } from "@/components/common/form-text-field";
import { Input } from "@/components/ui/input";
import { UserIdentity } from "@/components/layout/user-identity";
import type { User } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./settings-card";

export interface ProfileCardProps {
  user: User | null;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <SettingsCard
      title="Perfil"
      description="Tu nombre dentro de la aplicación."
    >
      <UserIdentity name={user?.name} email={user?.email} />

      <div className="grid gap-3.5 sm:grid-cols-2">
        <FormTextField
          name="name"
          label="Nombre"
          autoComplete="name"
          className="h-10"
        />
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Email</span>
          <div className="relative">
            <Lock className="field-icon left-3 size-[14px]" aria-hidden />
            <Input
              value={user?.email ?? ""}
              readOnly
              aria-label="Email"
              className={cn(
                FIELD_INPUT,
                "text-muted-foreground h-10 bg-[#F5F6F8] pl-[34px]",
              )}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
};
