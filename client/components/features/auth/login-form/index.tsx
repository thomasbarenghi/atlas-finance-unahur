"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { FormShell } from "@/components/common/form-shell";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/errors";
import { applyApiFieldErrors } from "@/lib/forms";
import { useLogin } from "@/lib/query/auth";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

export const LoginForm = () => {
  const router = useRouter();
  const login = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login.mutateAsync(values);
      router.replace("/dashboard");
    } catch (error) {
      applyApiFieldErrors(form.setError, error);
      toast.error(getErrorMessage(error, "No se pudo iniciar sesión"));
    }
  };

  const fillDemo = () => {
    form.setValue("email", "demo@atlassfin.app");
    form.setValue("password", "Demo1234!");
  };

  return (
    <FormShell form={form} onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="bg-muted/50 h-11 rounded-2xl border-0 pl-10"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contraseña</FormLabel>
            <FormControl>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="bg-muted/50 h-11 rounded-2xl border-0 pl-10"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="submit"
        className="h-11 rounded-2xl"
        disabled={login.isPending}
      >
        {login.isPending ? <Loader2 className="animate-spin" /> : null}
        Iniciar sesión
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-2xl"
        onClick={fillDemo}
      >
        Usar credenciales demo
      </Button>
    </FormShell>
  );
};
