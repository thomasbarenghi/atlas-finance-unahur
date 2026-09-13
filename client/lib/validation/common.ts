import { z } from "zod";

/**
 * Upper bound for the API `numeric(18,4)` money columns. Prevents sending
 * values the database cannot store (which would surface as a 400/500).
 */
export const MAX_MONEY = 99_999_999_999_999.9999;

const ISO_CURRENCY = /^[A-Za-z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const currencySchema = z
  .string()
  .regex(ISO_CURRENCY, "Elegí una moneda válida");

export const dateSchema = z.string().regex(ISO_DATE, "Elegí una fecha válida");

export const moneySchema = z.coerce
  .number()
  .finite("Ingresá un monto válido")
  .max(MAX_MONEY, "El monto es demasiado grande");

export const notesSchema = z.string().max(500, "Máximo 500 caracteres");

export const uuidSchema = z.string().uuid("Seleccioná una opción válida");

/** A UUID select that can be cleared to an empty string (then mapped to null). */
export const optionalIdSchema = z.union([uuidSchema, z.literal("")]).optional();

/** An optional ISO date that the date picker clears to an empty string. */
export const optionalDateSchema = z
  .union([dateSchema, z.literal("")])
  .optional();
