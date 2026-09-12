"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormShell } from "@/components/common/form-shell";
import { FormTextField } from "@/components/common/form-text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQueryParam } from "@/hooks/use-query-param";
import { getErrorMessage } from "@/lib/api/errors";
import { useResetPassword } from "@/lib/query/auth";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth";

export const ResetPasswordForm = () => {
  const router = useRouter();
  const token = useQueryParam("token");
  const reset = useResetPassword();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (token === null) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Enlace inválido</AlertTitle>
        <AlertDescription>
          El enlace de recuperación está incompleto o venció.
        </AlertDescription>
      </Alert>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await reset.mutateAsync({ token, password: values.password });
      toast.success("Contraseña actualizada");
      router.replace("/login");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "No se pudo actualizar la contraseña"),
      );
    }
  };

  return (
    <FormShell form={form} onSubmit={onSubmit}>
      <FormTextField
        name="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        description="8 a 72 caracteres, con al menos una letra y un número."
      />
      <FormTextField
        name="confirmPassword"
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
      />
      <Button type="submit" disabled={reset.isPending}>
        {reset.isPending ? <Loader2 className="animate-spin" /> : null}
        Guardar contraseña
      </Button>
    </FormShell>
  );
};
