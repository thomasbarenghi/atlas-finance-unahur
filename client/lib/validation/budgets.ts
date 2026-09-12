import { z } from "zod";
import { currencySchema, moneySchema } from "./common";

export const budgetSchema = z.object({
  categoryId: z.string().uuid("Elegí una categoría"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Elegí un período válido"),
  limit: moneySchema.min(0, "El límite no puede ser negativo"),
  currency: currencySchema,
  recurring: z.boolean(),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
