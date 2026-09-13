"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Pencil, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormMoneyField } from "@/components/common/form-money-field";
import { FormTextField } from "@/components/common/form-text-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/errors";
import type { Position } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { useCreatePosition, useUpdatePosition } from "@/lib/query/positions";
import {
  positionSchema,
  type PositionFormValues,
} from "@/lib/validation/assets";

export interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position;
}

export const PositionFormDialog = ({
  open,
  onOpenChange,
  position,
}: PositionFormDialogProps) => {
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const isEditing = Boolean(position);
  const isPending = createPosition.isPending || updatePosition.isPending;

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      symbol: position?.symbol ?? "",
      instrument: position?.instrument ?? "",
      quantity: position?.quantity ?? 0,
      avgCost: position?.avgCost ?? 0,
      currency: position?.currency ?? "USD",
    },
  });

  const symbol = useWatch({ control: form.control, name: "symbol" });
  const currencyWatch = useWatch({ control: form.control, name: "currency" });

  const onSubmit = async (values: PositionFormValues) => {
    try {
      if (position) {
        await updatePosition.mutateAsync({ id: position.id, input: values });
        toast.success("Posición actualizada");
      } else {
        await createPosition.mutateAsync(values);
        toast.success("Posición creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar la posición"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar posición" : "Nueva posición"}
      description="Se valúa con el último precio de mercado disponible."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear posición"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto"
    >
      <div className="from-primary/10 to-background flex w-full min-w-0 flex-col items-center gap-3 rounded-3xl border bg-gradient-to-b p-6 text-center">
        <span className="relative">
          <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
            <TrendingUp className="size-8" aria-hidden />
          </span>
          <span className="bg-background absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border">
            <Pencil className="size-3.5" aria-hidden />
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          {symbol ? `${symbol} · ${currencyWatch}` : "Inversión financiera"}
        </span>
        <FormField
          control={form.control}
          name="instrument"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  placeholder="Bitcoin"
                  className="h-auto border-0 bg-transparent px-0 text-center font-heading text-xl font-semibold shadow-none focus-visible:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
        <p className="text-muted-foreground text-xs">
          La cantidad y el costo promedio son tuyos; el precio lo aporta el
          mercado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormTextField name="symbol" label="Símbolo" placeholder="BTC" />
        <FormCurrencyField fallback="USD" disabled={isEditing} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormTextField
          name="quantity"
          label="Cantidad"
          type="number"
          step="any"
          min="0"
        />
        <FormMoneyField name="avgCost" label="Costo promedio" />
      </div>

      {position ? (
        <div className="rounded-2xl border p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="text-muted-foreground size-4" aria-hidden />
            <span className="text-sm font-medium">Valores automáticos</span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Precio actual</span>
              <span className="font-medium tabular-nums">
                {position.currentPrice === null
                  ? "Sin cotización"
                  : formatCurrency(position.currentPrice, position.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Valor actual</span>
              <span className="font-medium tabular-nums">
                {position.currentValue === null
                  ? "—"
                  : formatCurrency(position.currentValue, position.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Resultado</span>
              <span className="font-medium tabular-nums">
                {position.profitLoss === null
                  ? "—"
                  : formatCurrency(position.profitLoss, position.currency)}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Se derivan de la última cotización de mercado y no se editan
            manualmente.
          </p>
        </div>
      ) : null}
    </FormDialog>
  );
};
