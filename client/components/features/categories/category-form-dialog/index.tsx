"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { FormDialog } from "@/components/common/form-dialog";
import { FormSelectField } from "@/components/common/form-select-field";
import { FormTextField } from "@/components/common/form-text-field";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import { getErrorMessage } from "@/lib/api/errors";
import type { Category } from "@/lib/api/types";
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import {
  useArchiveCategory,
  useCreateCategory,
  useUpdateCategory,
} from "@/lib/query/categories";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  categorySchema,
  type CategoryFormValues,
} from "@/lib/validation/categories";
import type { CategoryFormDialogProps } from "./category-form-dialog.types";

const TYPE_OPTIONS = [
  { value: "expense", label: CATEGORY_TYPE_LABELS.expense },
  { value: "income", label: CATEGORY_TYPE_LABELS.income },
];

export const CategoryFormDialog = ({
  open,
  onOpenChange,
  category,
  initialType,
}: CategoryFormDialogProps) => {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const archiveCategory = useArchiveCategory();
  const isEditing = Boolean(category);

  const archiveAction = useConfirmAction<Category>({
    run: (target) => archiveCategory.mutateAsync(target.id),
    successMessage: "Categoría archivada",
    errorMessage: "No se pudo archivar",
    onSuccess: () => onOpenChange(false),
  });

  const isPending =
    createCategory.isPending ||
    updateCategory.isPending ||
    archiveAction.isPending;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? initialType ?? "expense",
      color: category?.color ?? CATEGORY_COLORS[0],
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      color: values.color,
    };
    try {
      if (category) {
        await updateCategory.mutateAsync({ id: category.id, input: payload });
        toast.success("Categoría actualizada");
      } else {
        await createCategory.mutateAsync(payload);
        toast.success("Categoría creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar la categoría"));
    }
  };

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEditing ? "Editar categoría" : "Nueva categoría"}
        description="Las categorías del sistema no se pueden editar."
        form={form}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Guardar" : "Crear categoría"}
        isPending={isPending}
        contentClassName="max-h-[90dvh] overflow-y-auto"
        footerStart={
          isEditing && !category?.isSystem ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive mr-auto"
              onClick={() => {
                if (category) archiveAction.request(category);
              }}
              disabled={isPending}
            >
              <Trash2 /> Archivar
            </Button>
          ) : undefined
        }
      >
        <FormTextField
          name="name"
          label="Nombre"
          placeholder="Comida, Sueldo…"
        />
        <FormSelectField
          name="type"
          label="Tipo"
          disabled={isEditing}
          options={TYPE_OPTIONS}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => field.onChange(color)}
                    aria-label={`Color ${color}`}
                    aria-pressed={field.value === color}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform",
                      field.value === color
                        ? "border-foreground scale-110"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormDialog>

      <ConfirmActionDialog
        action={archiveAction}
        title="Archivar categoría"
        description={(target) =>
          `La categoría "${target.name}" dejará de estar disponible para nuevos movimientos.`
        }
        confirmLabel="Archivar"
      />
    </>
  );
};
