import { z } from "zod";
import { newPasswordSchema } from "./common";

export const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  email: z
    .string()
    .trim()
    .email("Ingresá un email válido")
    .max(254, "El email no puede superar los 254 caracteres"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Ingresá tu contraseña actual")
      .max(72, "La contraseña no puede superar los 72 caracteres"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
