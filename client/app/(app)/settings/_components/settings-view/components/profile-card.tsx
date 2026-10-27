"use client";

import { FormTextField } from "@/components/common/form-text-field";
import { UserIdentity } from "@/components/layout/user-identity";
import type { User } from "@/lib/api/types";
import { SettingsCard } from "./settings-card";

export interface ProfileCardProps {
  user: User | null;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <SettingsCard title="Perfil" description="Tu nombre y correo de acceso.">
      <UserIdentity name={user?.name} email={user?.email} />

      <div className="grid gap-3.5 sm:grid-cols-2">
        <FormTextField
          name="name"
          label="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          className="h-10"
        />
        <FormTextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className="h-10"
        />
      </div>
    </SettingsCard>
  );
};
