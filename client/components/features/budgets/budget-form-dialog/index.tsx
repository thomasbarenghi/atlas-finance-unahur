"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { PiggyBank, Repeat } from "lucide-react";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormHero } from "@/components/common/form-hero";
import { FormSelectField } from "@/components/common/form-select-field";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { hexToRgba } from "@/lib/colors";
import {
  formatCurrency,
  monthInputValue,
  monthStartFromInput,
} from "@/lib/format";
import { buildMonthOptions } from "@/lib/period";
import { useCreateBudget, useUpdateBudget } from "@/lib/query/budgets";
import { cn } from "@/lib/utils";
import { budgetSchema, type BudgetFormValues } from "@/lib/validation/budgets";
import { BudgetCategoryPicker } from "./components/budget-category-picker";
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
      recurring: budget?.recurring ?? false,
    },
  });

  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const currency = useWatch({ control: form.control, name: "currency" });
  const limit = useWatch({ control: form.control, name: "limit" });

  const expenseCategories = categories.filter(
    (category) => category.type === "expense" && !category.archived,
  );
  const selectedCategory = expenseCategories.find(
    (category) => category.id === categoryId,
  );
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const formattedLimit = formatCurrency(Number(limit) || 0, currency || "ARS");

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      if (budget) {
        await updateBudget.mutateAsync({
          id: budget.id,
          input: {
            limit: values.limit,
            currency: values.currency,
            recurring: values.recurring,
          },
        });
        toast.success("Presupuesto actualizado");
      } else {
        await createBudget.mutateAsync({
          categoryId: values.categoryId,
          period: monthStartFromInput(values.period),
          limit: values.limit,
          currency: values.currency,
          recurring: values.recurring,
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
      contentClassName="max-h-[90dvh] overflow-y-auto"
    >
      <FormHero
        icon={
          <span
            className={cn(
              "flex size-16 items-center justify-center rounded-full",
              !selectedCategory && "bg-primary/10 text-primary",
            )}
            style={
              selectedCategory
                ? {
                    backgroundColor: hexToRgba(selectedCategory.color, 0.15),
                    color: selectedCategory.color,
                  }
                : undefined
            }
          >
            <PiggyBank className="size-8" aria-hidden />
          </span>
        }
        label={selectedCategory?.name ?? "Elegí una categoría"}
        accentColor={selectedCategory?.color}
        helper="Límite mensual del presupuesto."
      >
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="h-auto border-0 bg-transparent px-0 text-center font-heading text-3xl font-bold shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
        <span className="text-muted-foreground text-xs tabular-nums">
          {formattedLimit}
        </span>
      </FormHero>

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormLabel>Categoría</FormLabel>
            <BudgetCategoryPicker
              categories={expenseCategories}
              value={field.value}
              onChange={field.onChange}
              disabled={isEditing}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          name="period"
          label="Período"
          disabled={isEditing}
          options={monthOptions}
        />
        <FormCurrencyField fallback={user?.baseCurrency ?? "ARS"} />
      </div>

      <FormField
        control={form.control}
        name="recurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between gap-3 rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <Repeat
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <div className="flex flex-col gap-0.5">
                <FormLabel>Renovación automática</FormLabel>
                <FormDescription>
                  Se repite cada mes con el mismo límite hasta que la
                  desactives.
                </FormDescription>
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Renovación automática"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </FormDialog>
  );
};
