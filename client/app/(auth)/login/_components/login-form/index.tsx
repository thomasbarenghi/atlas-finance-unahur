"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { FormShell } from "@/components/common/form-shell";
import { AUTH_SUBMIT } from "@/components/common/ui-classes";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";
import { applyApiFieldErrors } from "@/lib/forms";
import { useLogin } from "@/lib/query/auth";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import { LoginField } from "./components/login-field";

const DEMO_EMAIL = "demo@atlassfin.app";
const DEMO_PASSWORD = "Demo1234!";

export const LoginForm = () => {
  const router = useRouter();
  const login = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login.mutateAsync(values);
      router.replace("/dashboard");
    } catch (error) {
      applyApiFieldErrors(form.setError, error);
      toast.error(getErrorMessage(error, "No se pudo iniciar sesión"));
    }
  };

  const useDemoAccount = () => {
    form.setValue("email", DEMO_EMAIL, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <FormShell form={form} onSubmit={onSubmit} className="gap-4">
        <LoginField
          name="email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="demo@atlassfin.app"
        />

        <LoginField
          name="password"
          label="Contraseña"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Tu contraseña"
          inputClassName="pr-10"
          trailing={
            <button
              type="button"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onClick={() => setShowPassword((value) => !value)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          }
        />

        <Button
          type="submit"
          className={AUTH_SUBMIT}
          disabled={login.isPending}
        >
          {login.isPending ? <Loader2 className="animate-spin" /> : null}
          Iniciar sesión
        </Button>
      </FormShell>

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-[10px]">o</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <button
        type="button"
        onClick={useDemoAccount}
        className="dark:bg-accent/30 flex flex-col items-start gap-1 rounded-xl border border-[#DEE7D9] bg-[#EEF2EB] px-3 py-3 text-left transition-colors hover:border-primary/30"
      >
        <span className="text-primary text-[10.5px] leading-[14px] font-bold">
          Cuenta de demostración
        </span>
        <span className="text-ink2 text-[11px] leading-[15px]">
          {DEMO_EMAIL} · {DEMO_PASSWORD}
        </span>
      </button>
    </div>
  );
};
