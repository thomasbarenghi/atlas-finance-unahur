"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormSelectField } from "@/components/common/form-select-field";
import { FormTextField } from "@/components/common/form-text-field";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { monthInputValue, monthStartFromInput } from "@/lib/format";
import { useCreateBudget, useUpdateBudget } from "@/lib/query/budgets";
import { budgetSchema, type BudgetFormValues } from "@/lib/validation/budgets";
import type { BudgetFormDialogProps } from "./budget-form-dialog.types";

export const BudgetFormDialog = ({
  open,
  onOpenChange,
  budget,
  categories,
  defaultPeriod,
}: BudgetFormDialogProps) => {
  const { user } = useAuth();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const isEditing = Boolean(budget);
  const isPending = createBudget.isPending || updateBudget.isPending;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: budget?.categoryId ?? "",
      period: monthInputValue(budget?.period ?? defaultPeriod),
      limit: budget?.limit ?? 0,
      currency: budget?.currency ?? user?.baseCurrency ?? "ARS",
    },
  });

  const expenseCategories = categories.filter(
    (category) => category.type === "expense" && !category.archived,
  );

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      if (budget) {
        await updateBudget.mutateAsync({
          id: budget.id,
          input: { limit: values.limit, currency: values.currency },
        });
        toast.success("Presupuesto actualizado");
      } else {
        await createBudget.mutateAsync({
          categoryId: values.categoryId,
          period: monthStartFromInput(values.period),
          limit: values.limit,
          currency: values.currency,
        });
        toast.success("Presupuesto creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar el presupuesto"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar presupuesto" : "Nuevo presupuesto"}
      description="Definí un límite mensual por categoría."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear presupuesto"}
      isPending={isPending}
    >
      <FormSelectField
        name="categoryId"
        label="Categoría"
        placeholder="Elegí una categoría"
        disabled={isEditing}
        options={expenseCategories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField
          name="period"
          label="Período"
          type="month"
          disabled={isEditing}
        />
        <FormCurrencyField fallback={user?.baseCurrency ?? "ARS"} />
      </div>
      <FormTextField
        name="limit"
        label="Límite mensual"
        type="number"
        step="0.01"
        min="0"
      />
    </FormDialog>
  );
};
