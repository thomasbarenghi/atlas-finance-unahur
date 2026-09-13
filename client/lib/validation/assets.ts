import { z } from "zod";
import {
  currencySchema,
  dateSchema,
  moneySchema,
  notesSchema,
  optionalIdSchema,
} from "./common";

export const assetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(80, "El nombre es demasiado largo"),
  type: z.enum([
    "property",
    "vehicle",
    "cash",
    "investment",
    "crypto",
    "other",
  ]),
  currency: currencySchema,
  initialValue: moneySchema.min(0, "El valor no puede ser negativo"),
  newValue: moneySchema.min(0, "El valor no puede ser negativo").optional(),
  date: dateSchema,
  notes: notesSchema.optional(),
});

export const valuationSchema = z.object({
  value: moneySchema.min(0, "El valor no puede ser negativo"),
  date: dateSchema,
});

export const debtSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(80, "El nombre es demasiado largo"),
  type: z.enum(["loan", "mortgage", "card", "other"]),
  balance: moneySchema.min(0, "El saldo no puede ser negativo"),
  currency: currencySchema,
  date: dateSchema,
  assetId: optionalIdSchema,
});

export const positionSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Ingresá el símbolo")
    .max(20, "El símbolo es demasiado largo"),
  instrument: z
    .string()
    .trim()
    .min(1, "Ingresá el instrumento")
    .max(80, "El instrumento es demasiado largo"),
  quantity: moneySchema.min(0, "La cantidad no puede ser negativa"),
  avgCost: moneySchema.min(0, "El costo promedio no puede ser negativo"),
  currency: currencySchema,
});

export type AssetFormValues = z.infer<typeof assetSchema>;
export type ValuationFormValues = z.infer<typeof valuationSchema>;
export type DebtFormValues = z.infer<typeof debtSchema>;
export type PositionFormValues = z.infer<typeof positionSchema>;
