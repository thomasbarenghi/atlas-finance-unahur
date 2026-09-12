import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(1, "Ingresá un nombre"),
  type: z.enum([
    "property",
    "vehicle",
    "cash",
    "investment",
    "crypto",
    "other",
  ]),
  currency: z.string().min(3, "Elegí una moneda"),
  initialValue: z.coerce.number().positive("El valor debe ser mayor que cero"),
  date: z.string().min(1, "Elegí una fecha de valuación"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export const valuationSchema = z.object({
  value: z.coerce.number().positive("El valor debe ser mayor que cero"),
  date: z.string().min(1, "Elegí una fecha"),
});

export const debtSchema = z.object({
  name: z.string().min(1, "Ingresá un nombre"),
  type: z.enum(["loan", "mortgage", "card", "other"]),
  balance: z.coerce.number().positive("El saldo debe ser mayor que cero"),
  currency: z.string().min(3, "Elegí una moneda"),
  date: z.string().min(1, "Elegí una fecha"),
  assetId: z.string().optional(),
});

export const positionSchema = z.object({
  symbol: z.string().min(1, "Ingresá el símbolo"),
  instrument: z.string().min(1, "Ingresá el instrumento"),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero"),
  avgCost: z.coerce
    .number()
    .positive("El costo promedio debe ser mayor que cero"),
  currency: z.string().min(3, "Elegí una moneda"),
});

export type AssetFormValues = z.infer<typeof assetSchema>;
export type ValuationFormValues = z.infer<typeof valuationSchema>;
export type DebtFormValues = z.infer<typeof debtSchema>;
export type PositionFormValues = z.infer<typeof positionSchema>;
