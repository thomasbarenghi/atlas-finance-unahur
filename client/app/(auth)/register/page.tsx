import Link from "next/link";
import { AuthHeading } from "@/app/(auth)/_components/auth-heading";
import { RegisterForm } from "@/app/(auth)/register/_components/register-form";

const RegisterPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Crear cuenta"
        description="Empezá a organizar tus finanzas personales."
      />
      <RegisterForm />
      <p className="text-muted-foreground text-center text-[11px]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary font-bold">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
