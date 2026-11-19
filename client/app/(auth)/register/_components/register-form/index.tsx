"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormShell } from "@/components/common/form-shell";
import { FormTextField } from "@/components/common/form-text-field";
import { CurrencyFormField } from "@/components/common/currency-form-field";
import { AUTH_SUBMIT } from "@/components/common/ui-classes";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";
import { applyApiFieldErrors } from "@/lib/forms";
import { useRegister } from "@/lib/query/auth";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth";

export const RegisterForm = () => {
  const router = useRouter();
  const register = useRegister();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      primaryCurrency: "ARS",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        primaryCurrency: values.primaryCurrency,
      });
      toast.success("Cuenta creada");
      router.replace("/dashboard");
    } catch (error) {
      applyApiFieldErrors(form.setError, error);
      toast.error(getErrorMessage(error, "No se pudo crear la cuenta"));
    }
  };

  return (
    <FormShell form={form} onSubmit={onSubmit}>
      <FormTextField
        name="name"
        label="Nombre"
        autoComplete="name"
        placeholder="Tu nombre"
      />
      <FormTextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
      />
      <CurrencyFormField
        name="primaryCurrency"
        label="Moneda principal"
        hint="Se usa para mostrar tus totales. Podés cambiarla después."
      />
      <FormTextField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        description="8 a 72 caracteres, con al menos una letra y un número."
      />
      <FormTextField
        name="confirmPassword"
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Repetí tu contraseña"
      />
      <Button
        type="submit"
        disabled={register.isPending}
        className={AUTH_SUBMIT}
      >
        {register.isPending ? <Loader2 className="animate-spin" /> : null}
        Crear cuenta
      </Button>
    </FormShell>
  );
};
