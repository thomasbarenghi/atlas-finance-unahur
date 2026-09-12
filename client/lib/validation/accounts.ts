import { z } from "zod";
import { currencySchema, moneySchema, notesSchema } from "./common";

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(80, "El nombre es demasiado largo"),
  type: z.enum(["cash", "bank", "wallet", "card", "other"]),
  currency: currencySchema,
  initialBalance: moneySchema,
  notes: notesSchema.optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
