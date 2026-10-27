"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";
import { applyApiFieldErrors } from "@/lib/forms";
import { useChangePassword } from "@/lib/query/users";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/validation/settings";

const EMPTY_VALUES: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const useChangePasswordForm = () => {
  const changePassword = useChangePassword();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.reset(EMPTY_VALUES);
      toast.success("Contraseña actualizada");
    } catch (error) {
      applyApiFieldErrors(form.setError, error);
      toast.error(getErrorMessage(error, "No se pudo cambiar la contraseña"));
    }
  };

  return {
    form,
    onSubmit,
    isPending: changePassword.isPending,
  };
};
