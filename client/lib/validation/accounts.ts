import { z } from "zod";

export const accountSchema = z.object({
  name: z
    .string()
    .min(1, "Ingresá un nombre")
    .max(80, "El nombre es demasiado largo"),
  type: z.enum(["cash", "bank", "wallet", "card", "other", "goal"]),
  currency: z.string().min(3, "Elegí una moneda"),
  initialBalance: z.coerce.number(),
  targetAmount: z.coerce
    .number()
    .min(0, "El objetivo no puede ser negativo")
    .optional(),
  targetDate: z.string().optional(),
  sourceAccountId: z.string().optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
