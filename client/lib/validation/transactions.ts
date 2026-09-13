import { z } from "zod";
import {
  currencySchema,
  dateSchema,
  moneySchema,
  notesSchema,
  optionalIdSchema,
} from "./common";

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: moneySchema.positive("El monto debe ser mayor que cero"),
    currency: currencySchema,
    date: dateSchema,
    accountId: z.string().uuid("Elegí una cuenta"),
    transferAccountId: optionalIdSchema,
    categoryId: optionalIdSchema,
    description: z
      .string()
      .trim()
      .min(1, "Ingresá una descripción")
      .max(120, "Máximo 120 caracteres"),
    notes: notesSchema.optional(),
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
