"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/common/date-picker";
import { FormShell } from "@/components/common/form-shell";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import type { Asset } from "@/lib/api/types";
import { formatCurrency, formatDate, todayIso } from "@/lib/format";
import { useCreateValuation, useValuations } from "@/lib/query/assets";
import {
  valuationSchema,
  type ValuationFormValues,
} from "@/lib/validation/assets";

export interface ValuationSheetProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ValuationSheet = ({
  asset,
  open,
  onOpenChange,
}: ValuationSheetProps) => {
  const valuationsQuery = useValuations(asset?.id ?? "");
  const createValuation = useCreateValuation();

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationSchema),
    defaultValues: { value: 0, date: todayIso() },
  });

  const onSubmit = async (values: ValuationFormValues) => {
    if (!asset) return;
    try {
      await createValuation.mutateAsync({
        assetId: asset.id,
        input: {
          value: values.value,
          date: values.date,
          currency: asset.currency,
          source: "manual",
        },
      });
      toast.success("Valuación agregada");
      form.reset({ value: 0, date: todayIso() });
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo agregar la valuación"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Historial de valuaciones</SheetTitle>
          <SheetDescription>
            {asset
              ? `${asset.name} · valor vigente ${formatCurrency(asset.currentValue, asset.currency)}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-6">
          <FormShell
            form={form}
            onSubmit={onSubmit}
            className="rounded-2xl border p-4"
          >
            <span className="font-heading text-sm font-semibold">
              Nueva valuación
            </span>
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={createValuation.isPending || !asset}
            >
              {createValuation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Agregar valuación
            </Button>
          </FormShell>

          <div className="flex flex-col gap-2">
            <span className="font-heading text-sm font-semibold">
              Valuaciones
            </span>
            {valuationsQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (valuationsQuery.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Todavía no hay valuaciones.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {(valuationsQuery.data ?? []).map((valuation) => (
                  <li
                    key={valuation.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {formatDate(valuation.date)}
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(valuation.value, valuation.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
