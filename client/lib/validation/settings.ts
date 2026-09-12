import { z } from "zod";
import { currencySchema } from "./common";

export const settingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  baseCurrency: currencySchema,
  aiEnabled: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
