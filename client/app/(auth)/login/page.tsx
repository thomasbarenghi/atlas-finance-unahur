import Link from "next/link";
import { AuthHeading } from "@/components/features/auth/auth-heading";
import { LoginForm } from "@/components/features/auth/login-form";

const LoginPage = () => {
  return (
    <div className="mb-[90px] flex flex-col gap-6">
      <AuthHeading
        title="Iniciar sesión"
        description="Ingresá con tu cuenta para ver tus finanzas."
        size="lg"
        align="start"
      />
      <LoginForm />
      <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
        <Link href="/forgot-password" className="hover:text-foreground">
          ¿Olvidaste tu contraseña?
        </Link>
        <span>
          ¿No tenés cuenta?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline"
          >
            Registrate
          </Link>
        </span>
      </div>
    </div>
  );
};

export default LoginPage;
