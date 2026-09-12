"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDateField } from "@/components/common/form-date-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormHero } from "@/components/common/form-hero";
import { FormTextField } from "@/components/common/form-text-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import type { AssetType } from "@/lib/api/types";
import { todayIso } from "@/lib/format";
import { ASSET_TYPE_LABELS, ASSET_TYPE_VALUES } from "@/lib/labels";
import {
  useArchiveAsset,
  useCreateAsset,
  useCreateValuation,
  useUpdateAsset,
} from "@/lib/query/assets";
import { cn } from "@/lib/utils";
import { assetSchema, type AssetFormValues } from "@/lib/validation/assets";
import {
  AssetIcon,
  ASSET_TYPE_ICONS,
} from "@/components/features/assets/asset-icon";
import type { AssetFormDialogProps } from "./asset-form-dialog.types";

const HELPER_TEXT: Record<AssetType, string> = {
  property:
    "Casas, departamentos y terrenos. Podés cargar una nueva valuación cuando cambie.",
  vehicle: "Autos, motos y otros rodados. Se valúa por su valor de mercado.",
  cash: "Efectivo guardado o dinero fuera del sistema bancario.",
  investment: "Inversiones físicas o instrumentos sin cotización automática.",
  crypto: "Criptoactivos con cotización de mercado.",
  other: "Otros bienes que forman parte de tu patrimonio.",
};

export const AssetFormDialog = ({
  open,
  onOpenChange,
  asset,
}: AssetFormDialogProps) => {
  const { user } = useAuth();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const createValuation = useCreateValuation();
  const archiveAsset = useArchiveAsset();
  const isEditing = Boolean(asset);
  const isPending =
    createAsset.isPending ||
    updateAsset.isPending ||
    createValuation.isPending ||
    archiveAsset.isPending;

  const [archived, setArchived] = useState(asset?.archived ?? false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: asset?.name ?? "",
      type: asset?.type ?? "property",
      currency: asset?.currency ?? user?.baseCurrency ?? "ARS",
      initialValue: asset?.currentValue ?? 0,
      newValue: undefined,
      date: asset?.valuationDate ?? todayIso(),
      notes: asset?.notes ?? "",
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const firstType = asset?.type ?? "property";
  const typeOrder = [
    firstType,
    ...ASSET_TYPE_VALUES.filter((value) => value !== firstType),
  ];

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
        if (
          values.newValue &&
          values.newValue > 0 &&
          values.newValue !== asset.currentValue
        ) {
          await createValuation.mutateAsync({
            assetId: asset.id,
            input: {
              value: values.newValue,
              currency: values.currency,
              date: values.date,
              source: "manual",
            },
          });
        }
        if (archived && !asset.archived) {
          await archiveAsset.mutateAsync(asset.id);
        }
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
      description={
        isEditing
          ? "Actualizá los datos o registrá una nueva valuación."
          : "Cargá el bien y su valor para sumarlo a tu patrimonio."
      }
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear activo"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto"
    >
      <FormHero
        icon={<AssetIcon type={type} className="size-16 [&_svg]:size-8" />}
        label={ASSET_TYPE_LABELS[type]}
        helper={HELPER_TEXT[type]}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  placeholder="Departamento"
                  className="h-auto border-0 bg-transparent px-0 text-center font-heading text-xl font-semibold shadow-none focus-visible:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
      </FormHero>

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormLabel>Tipo</FormLabel>
            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {typeOrder.map((value) => {
                const Icon = ASSET_TYPE_ICONS[value];
                const active = field.value === value;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {ASSET_TYPE_LABELS[value]}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        {isEditing ? (
          <FormTextField
            name="newValue"
            label="Nueva valuación"
            type="number"
            step="0.01"
            min="0"
            placeholder="Igual al actual"
          />
        ) : (
          <FormTextField
            name="initialValue"
            label="Valor inicial"
            type="number"
            step="0.01"
            min="0"
          />
        )}
        <FormCurrencyField fallback={user?.baseCurrency ?? "ARS"} />
      </div>

      {isEditing ? (
        <p className="text-muted-foreground -mt-2 text-xs">
          Si ingresás un valor distinto al actual, se agrega al historial sin
          borrar valuaciones anteriores.
        </p>
      ) : null}

      <FormDateField name="date" label="Fecha de valuación" />

      <FormTextField name="notes" label="Observaciones" multiline />

      {isEditing ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <Archive
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Activo archivado</span>
              <span className="text-muted-foreground text-xs">
                {asset?.archived
                  ? "Este activo ya está archivado y no suma a tu patrimonio."
                  : "Se oculta del inicio y deja de sumar a tu patrimonio."}
              </span>
            </div>
          </div>
          <Switch
            checked={archived}
            onCheckedChange={setArchived}
            disabled={asset?.archived}
            aria-label="Archivar activo"
          />
        </div>
      ) : null}
    </FormDialog>
  );
};
