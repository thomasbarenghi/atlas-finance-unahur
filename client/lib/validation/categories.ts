import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre")
    .max(40, "El nombre es demasiado largo"),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elegí un color"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
