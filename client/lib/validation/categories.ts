import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Ingresá un nombre")
    .max(60, "El nombre es demasiado largo"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4, "Elegí un color"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const CATEGORY_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;
