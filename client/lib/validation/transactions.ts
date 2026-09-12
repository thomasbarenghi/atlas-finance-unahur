import { z } from "zod";

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().positive("El monto debe ser mayor que cero"),
    currency: z.string().min(3, "Elegí una moneda"),
    date: z.string().min(1, "Elegí una fecha"),
    accountId: z.string().min(1, "Elegí una cuenta"),
    transferAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    description: z
      .string()
      .min(1, "Ingresá una descripción")
      .max(120, "Máximo 120 caracteres"),
    notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  })
  .refine(
    (data) =>
      data.type !== "transfer" ||
      (data.transferAccountId && data.transferAccountId !== data.accountId),
    {
      path: ["transferAccountId"],
      message: "Elegí una cuenta de destino distinta",
    },
  )
  .refine((data) => data.type === "transfer" || Boolean(data.categoryId), {
    path: ["categoryId"],
    message: "Elegí una categoría",
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
