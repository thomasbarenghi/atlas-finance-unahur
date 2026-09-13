import { AuthHeading } from "@/components/features/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";

const ForgotPasswordPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Recuperar contraseña"
        description="Te enviamos un enlace para restablecerla."
      />
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
