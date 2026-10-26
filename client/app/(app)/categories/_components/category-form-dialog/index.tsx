"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormDialog } from "@/components/common/form-dialog";
import { FormTextField } from "@/components/common/form-text-field";
import { getErrorMessage } from "@/lib/api/errors";
import type { Category, CategoryType } from "@/lib/api/types";
import { applyApiFieldErrors } from "@/lib/forms";
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import { useCreateCategory, useUpdateCategory } from "@/lib/query/categories";
import {
  categorySchema,
  type CategoryFormValues,
} from "@/lib/validation/categories";
import { cn } from "@/lib/utils";

const DEFAULT_COLOR = "#3b82f6";

const COLORS = [
  { value: "#22c55e", label: "Verde" },
  { value: "#0ea5e9", label: "Celeste" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#6366f1", label: "Índigo" },
  { value: "#a855f7", label: "Violeta" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#f97316", label: "Naranja" },
  { value: "#eab308", label: "Amarillo" },
  { value: "#64748b", label: "Gris" },
];

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  initialType?: CategoryType;
  onSaved?: (category: Category) => void;
}

export const CategoryFormDialog = ({
  open,
  onOpenChange,
  category,
  initialType = "expense",
  onSaved,
}: CategoryFormDialogProps) => {
  const isEditing = Boolean(category);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: initialType,
      color: DEFAULT_COLOR,
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const color = useWatch({ control: form.control, name: "color" });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: category?.name ?? "",
      type: category?.type ?? initialType,
      color: category?.color ?? DEFAULT_COLOR,
    });
  }, [open, category, initialType, form]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const saved = category
        ? await updateCategory.mutateAsync({
            id: category.id,
            input: { name: values.name, color: values.color },
          })
        : await createCategory.mutateAsync(values);
      toast.success(category ? "Categoría actualizada" : "Categoría creada");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      if (!applyApiFieldErrors(form.setError, error)) {
        toast.error(getErrorMessage(error, "No se pudo guardar la categoría"));
      }
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar categoría" : "Nueva categoría"}
      description={
        isEditing
          ? "Cambiá el nombre o el color; el tipo no se puede modificar."
          : "Creá una categoría propia para clasificar tus movimientos."
      }
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Crear categoría"}
      isPending={isPending}
    >
      <FormTextField
        name="name"
        label="Nombre"
        placeholder="Ej. Mascotas"
        autoComplete="off"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Tipo</span>
        <div
          role="group"
          aria-label="Tipo de categoría"
          className="bg-muted grid grid-cols-2 gap-1 rounded-xl p-1"
        >
          {(["expense", "income"] as const).map((option) => (
            <button
              key={option}
              type="button"
              disabled={isEditing}
              aria-pressed={type === option}
              onClick={() =>
                form.setValue("type", option, { shouldValidate: true })
              }
              className={cn(
                "rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                type === option
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
                isEditing && "cursor-not-allowed opacity-60",
              )}
            >
              {CATEGORY_TYPE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Color</span>
        <div
          role="group"
          aria-label="Color de la categoría"
          className="flex flex-wrap gap-2"
        >
          {COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={color === option.value}
              onClick={() =>
                form.setValue("color", option.value, { shouldValidate: true })
              }
              className={cn(
                "size-8 rounded-full border-2 transition-transform",
                color === option.value
                  ? "border-foreground scale-110"
                  : "border-transparent",
              )}
              style={{ backgroundColor: option.value }}
            />
          ))}
        </div>
      </div>
    </FormDialog>
  );
};
