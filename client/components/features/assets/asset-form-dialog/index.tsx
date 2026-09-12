"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDateField } from "@/components/common/form-date-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormSelectField } from "@/components/common/form-select-field";
import { FormTextField } from "@/components/common/form-text-field";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { todayIso } from "@/lib/format";
import { ASSET_TYPE_LABELS, ASSET_TYPE_VALUES } from "@/lib/labels";
import { useCreateAsset, useUpdateAsset } from "@/lib/query/assets";
import { assetSchema, type AssetFormValues } from "@/lib/validation/assets";
import type { AssetFormDialogProps } from "./asset-form-dialog.types";

const TYPE_OPTIONS = ASSET_TYPE_VALUES.map((type) => ({
  value: type,
  label: ASSET_TYPE_LABELS[type],
}));

export const AssetFormDialog = ({
  open,
  onOpenChange,
  asset,
}: AssetFormDialogProps) => {
  const { user } = useAuth();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const isEditing = Boolean(asset);
  const isPending = createAsset.isPending || updateAsset.isPending;

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: asset?.name ?? "",
      type: asset?.type ?? "property",
      currency: asset?.currency ?? user?.baseCurrency ?? "ARS",
      initialValue: asset?.currentValue ?? 0,
      date: asset?.valuationDate ?? todayIso(),
      notes: asset?.notes ?? "",
    },
  });

  const onSubmit = async (values: AssetFormValues) => {
    try {
      if (asset) {
        await updateAsset.mutateAsync({
          id: asset.id,
          input: {
            name: values.name,
            type: values.type,
            currency: values.currency,
            date: values.date,
            notes: values.notes ?? null,
          },
        });
        toast.success("Activo actualizado");
      } else {
        await createAsset.mutateAsync({
          name: values.name,
          type: values.type,
          currency: values.currency,
          initialValue: values.initialValue,
          date: values.date,
          notes: values.notes ?? null,
        });
        toast.success("Activo creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar el activo"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar activo" : "Nuevo activo"}
      description="Registrá tipo, moneda y valuación."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear activo"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto"
    >
      <FormTextField name="name" label="Nombre" placeholder="Departamento" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField name="type" label="Tipo" options={TYPE_OPTIONS} />
        <FormCurrencyField />
      </div>
      {!isEditing ? (
        <FormTextField
          name="initialValue"
          label="Valor inicial"
          type="number"
          step="0.01"
          min="0"
        />
      ) : null}
      <FormDateField name="date" label="Fecha de valuación" />
      <FormTextField name="notes" label="Notas" multiline />
    </FormDialog>
  );
};
