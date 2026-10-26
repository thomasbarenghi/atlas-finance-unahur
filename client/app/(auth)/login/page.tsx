import Link from "next/link";
import { AuthHeading } from "@/app/(auth)/_components/auth-heading";
import { LoginForm } from "@/app/(auth)/login/_components/login-form";

const LoginPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <AuthHeading
        title="Iniciar sesión"
        description="Ingresá con tu cuenta para ver tus finanzas."
      />
      <LoginForm />
      <p className="text-muted-foreground text-center text-[11px]">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-primary font-bold">
          Registrate
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
