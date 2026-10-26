"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useUpdateMe } from "@/lib/query/users";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/lib/validation/settings";

export const useSettingsForm = () => {
  const { user } = useAuth();
  const updateMe = useUpdateMe();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({ name: user.name });
  }, [user, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMe.mutateAsync(values);
      form.reset(values);
      toast.success("Preferencias guardadas");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron guardar los cambios"));
    }
  };

  return {
    user,
    form,
    onSubmit,
    isPending: updateMe.isPending,
    isDirty: form.formState.isDirty,
  };
};
