import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Elegí una categoría"),
  period: z.string().min(7, "Elegí un período"),
  limit: z.coerce.number().positive("El límite debe ser mayor que cero"),
  currency: z.string().min(3, "Elegí una moneda"),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
