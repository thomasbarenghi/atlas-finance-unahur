import { z } from "zod";
import { newPasswordSchema } from "./common";

export const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z
    .string()
    .min(1, "Ingresá tu contraseña")
    .max(72, "La contraseña no puede superar los 72 caracteres"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "El nombre no puede superar los 80 caracteres"),
    email: z.string().email("Ingresá un email válido"),
    password: newPasswordSchema,
    primaryCurrency: z.string().min(1, "Elegí una moneda"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
