import { z } from "zod";
import {
  currencySchema,
  moneySchema,
  optionalDateSchema,
  optionalIdSchema,
} from "./common";

export const goalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(80, "El nombre es demasiado largo"),
  savedAmount: moneySchema.min(0, "El monto asignado no puede ser negativo"),
  targetAmount: moneySchema.min(0, "El monto objetivo no puede ser negativo"),
  currency: currencySchema,
  targetDate: optionalDateSchema,
  sourceAccountId: optionalIdSchema,
});

export type GoalFormValues = z.infer<typeof goalSchema>;
