import Link from "next/link";
import { AuthHeading } from "@/components/features/auth/auth-heading";
import { RegisterForm } from "@/components/features/auth/register-form";

const RegisterPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Crear cuenta"
        description="Empezá a organizar tus finanzas personales."
      />
      <RegisterForm />
      <p className="text-muted-foreground text-center text-sm">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
