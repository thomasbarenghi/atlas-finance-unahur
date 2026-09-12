"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Archive, Target, X } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormHero } from "@/components/common/form-hero";
import { FormTextField } from "@/components/common/form-text-field";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import {
  useArchiveGoal,
  useCreateGoal,
  useRestoreGoal,
  useUpdateGoal,
} from "@/lib/query/goals";
import { useAccounts } from "@/lib/query/accounts";
import { goalSchema, type GoalFormValues } from "@/lib/validation/goals";
import type { GoalFormDialogProps } from "./goal-form-dialog.types";

export const GoalFormDialog = ({
  open,
  onOpenChange,
  goal,
}: GoalFormDialogProps) => {
  const { user } = useAuth();
  const accountsQuery = useAccounts();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const archiveGoal = useArchiveGoal();
  const restoreGoal = useRestoreGoal();
  const isEditing = Boolean(goal);
  const isPending =
    createGoal.isPending ||
    updateGoal.isPending ||
    archiveGoal.isPending ||
    restoreGoal.isPending;

  const [archived, setArchived] = useState(goal?.archived ?? false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name ?? "",
      savedAmount: goal?.savedAmount ?? 0,
      targetAmount: goal?.targetAmount ?? 0,
      currency: goal?.currency ?? user?.baseCurrency ?? "ARS",
      targetDate: goal?.targetDate ?? "",
      sourceAccountId: goal?.sourceAccountId ?? "",
    },
  });

  const sourceAccounts = (accountsQuery.data ?? []).filter(
    (account) => !account.archived,
  );

  const onSubmit = async (values: GoalFormValues) => {
    const payload = {
      name: values.name,
      savedAmount: values.savedAmount,
      targetAmount: values.targetAmount,
      currency: values.currency,
      targetDate: values.targetDate ? values.targetDate : null,
      sourceAccountId: values.sourceAccountId ? values.sourceAccountId : null,
    };
    try {
      if (goal) {
        await updateGoal.mutateAsync({ id: goal.id, input: payload });
        if (archived !== goal.archived) {
          const mutation = archived ? archiveGoal : restoreGoal;
          await mutation.mutateAsync(goal.id);
        }
        toast.success("Meta actualizada");
      } else {
        await createGoal.mutateAsync(payload);
        toast.success("Meta creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar meta" : "Nueva meta"}
      description="Asociá la meta a la cuenta donde vive el dinero."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear meta"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto"
    >
      <FormHero
        icon={<Target className="size-8" aria-hidden />}
        label="Meta de ahorro"
        helper="El dinero vive en la cuenta que elijas y no suma aparte al patrimonio."
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  placeholder="Vacaciones"
                  className="h-auto border-0 bg-transparent px-0 text-center font-heading text-xl font-semibold shadow-none focus-visible:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
      </FormHero>

      <div className="grid grid-cols-2 gap-3">
        <FormTextField
          name="savedAmount"
          label="Monto asignado"
          type="number"
          step="0.01"
          min="0"
        />
        <FormTextField
          name="targetAmount"
          label="Monto objetivo"
          type="number"
          step="0.01"
          min="0"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormCurrencyField fallback={user?.baseCurrency ?? "ARS"} />
        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha límite</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={field.value || undefined}
                    onChange={field.onChange}
                  />
                  {field.value ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar fecha"
                      onClick={() => field.onChange("")}
                    >
                      <X />
                    </Button>
                  ) : null}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="sourceAccountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>¿Dónde vive el dinero?</FormLabel>
            <Select
              value={field.value || "none"}
              onValueChange={(value) =>
                field.onChange(value === "none" ? "" : value)
              }
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí una cuenta" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {sourceAccounts.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {isEditing ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <Archive
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Meta archivada</span>
              <span className="text-muted-foreground text-xs">
                Se oculta del inicio y no permite nuevos aportes.
              </span>
            </div>
          </div>
          <Switch
            checked={archived}
            onCheckedChange={setArchived}
            aria-label="Archivar meta"
          />
        </div>
      ) : null}
    </FormDialog>
  );
};
