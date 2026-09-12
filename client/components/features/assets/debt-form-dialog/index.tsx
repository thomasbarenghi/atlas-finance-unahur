"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDateField } from "@/components/common/form-date-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormSelectField } from "@/components/common/form-select-field";
import { FormTextField } from "@/components/common/form-text-field";
import { getErrorMessage } from "@/lib/api/errors";
import type { Asset, Debt } from "@/lib/api/types";
import { todayIso } from "@/lib/format";
import { DEBT_TYPE_LABELS, DEBT_TYPE_VALUES } from "@/lib/labels";
import { useCreateDebt, useUpdateDebt } from "@/lib/query/debts";
import { debtSchema, type DebtFormValues } from "@/lib/validation/assets";

export interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt;
  assets: Asset[];
}

const TYPE_OPTIONS = DEBT_TYPE_VALUES.map((type) => ({
  value: type,
  label: DEBT_TYPE_LABELS[type],
}));

export const DebtFormDialog = ({
  open,
  onOpenChange,
  debt,
  assets,
}: DebtFormDialogProps) => {
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const isEditing = Boolean(debt);
  const isPending = createDebt.isPending || updateDebt.isPending;

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: debt?.name ?? "",
      type: debt?.type ?? "loan",
      balance: debt?.balance ?? 0,
      currency: debt?.currency ?? "ARS",
      date: debt?.date ?? todayIso(),
      assetId: debt?.assetId ?? "none",
    },
  });

  const onSubmit = async (values: DebtFormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      balance: values.balance,
      currency: values.currency,
      date: values.date,
      assetId:
        values.assetId && values.assetId !== "none" ? values.assetId : null,
    };
    try {
      if (debt) {
        await updateDebt.mutateAsync({ id: debt.id, input: payload });
        toast.success("Deuda actualizada");
      } else {
        await createDebt.mutateAsync(payload);
        toast.success("Deuda creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar la deuda"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar deuda" : "Nueva deuda"}
      description="Podés vincularla a un activo para ver el patrimonio neto."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear deuda"}
      isPending={isPending}
    >
      <FormTextField name="name" label="Nombre" placeholder="Hipoteca" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField name="type" label="Tipo" options={TYPE_OPTIONS} />
        <FormCurrencyField />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField
          name="balance"
          label="Saldo"
          type="number"
          step="0.01"
          min="0"
        />
        <FormDateField name="date" label="Fecha" />
      </div>
      <FormSelectField
        name="assetId"
        label="Activo vinculado"
        options={[
          { value: "none", label: "Sin vincular" },
          ...assets.map((asset) => ({ value: asset.id, label: asset.name })),
        ]}
      />
    </FormDialog>
  );
};
