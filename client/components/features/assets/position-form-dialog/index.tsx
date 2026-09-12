"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormTextField } from "@/components/common/form-text-field";
import { getErrorMessage } from "@/lib/api/errors";
import type { Position } from "@/lib/api/types";
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
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField name="symbol" label="Símbolo" placeholder="BTC" />
        <FormTextField
          name="instrument"
          label="Instrumento"
          placeholder="Bitcoin"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField
          name="quantity"
          label="Cantidad"
          type="number"
          step="any"
          min="0"
        />
        <FormTextField
          name="avgCost"
          label="Costo promedio"
          type="number"
          step="0.01"
          min="0"
        />
      </div>
      <FormCurrencyField fallback="USD" />
    </FormDialog>
  );
};
