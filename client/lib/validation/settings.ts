import { z } from "zod";

export const settingsSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  baseCurrency: z.string().min(3, "Elegí una moneda"),
  aiEnabled: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
