import { z } from "zod";

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, "Ingresá un nombre")
    .max(80, "El nombre es demasiado largo"),
  savedAmount: z.coerce
    .number()
    .min(0, "El monto asignado no puede ser negativo"),
  targetAmount: z.coerce
    .number()
    .min(0, "El monto objetivo no puede ser negativo"),
  currency: z.string().min(3, "Elegí una moneda"),
  targetDate: z.string().optional(),
  sourceAccountId: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
