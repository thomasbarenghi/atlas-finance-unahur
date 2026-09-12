import { AuthHeading } from "@/components/features/auth/auth-heading";
import { ResetPasswordForm } from "@/components/features/auth/reset-password-form";

const ResetPasswordPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Nueva contraseña"
        description="Elegí una contraseña segura para tu cuenta."
      />
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPasswordPage;
