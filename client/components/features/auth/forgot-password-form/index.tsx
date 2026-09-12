"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { FormShell } from "@/components/common/form-shell";
import { FormTextField } from "@/components/common/form-text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";
import { useForgotPassword } from "@/lib/query/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/auth";

export const ForgotPasswordForm = () => {
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgot.mutateAsync(values);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo enviar el email"));
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <MailCheck />
          <AlertTitle>Revisá tu correo</AlertTitle>
          <AlertDescription>
            Si el email está registrado, vas a recibir un enlace para
            restablecer tu contraseña.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => setSent(false)}>
          Reintentar
        </Button>
        <Button asChild variant="ghost">
          <Link href="/login">Volver al login</Link>
        </Button>
      </div>
    );
  }

  return (
    <FormShell form={form} onSubmit={onSubmit}>
      <FormTextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
      />
      <Button type="submit" disabled={forgot.isPending}>
        {forgot.isPending ? <Loader2 className="animate-spin" /> : null}
        Enviar enlace
      </Button>
      <Button asChild variant="ghost">
        <Link href="/login">Volver al login</Link>
      </Button>
    </FormShell>
  );
};
