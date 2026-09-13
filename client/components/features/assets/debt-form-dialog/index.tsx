"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Archive,
  CircleDollarSign,
  CreditCard,
  House,
  Landmark,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDateField } from "@/components/common/form-date-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormMoneyField } from "@/components/common/form-money-field";
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
import type { Asset, Debt, DebtType } from "@/lib/api/types";
import { todayIso } from "@/lib/format";
import { DEBT_TYPE_LABELS, DEBT_TYPE_VALUES } from "@/lib/labels";
import {
  useArchiveDebt,
  useCreateDebt,
  useUpdateDebt,
} from "@/lib/query/debts";
import { cn } from "@/lib/utils";
import { debtSchema, type DebtFormValues } from "@/lib/validation/assets";

export interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt;
  assets: Asset[];
}

const DEBT_TYPE_ICONS: Record<DebtType, LucideIcon> = {
  loan: Landmark,
  mortgage: House,
  card: CreditCard,
  other: CircleDollarSign,
};

const HELPER_TEXT: Record<DebtType, string> = {
  loan: "Préstamo bancario o personal. Se descuenta de tu patrimonio.",
  mortgage: "Crédito hipotecario. Podés vincularlo a la propiedad.",
  card: "Tarjeta de crédito. El saldo es la deuda actual.",
  other: "Otra deuda que quieras seguir.",
};

export const DebtFormDialog = ({
  open,
  onOpenChange,
  debt,
  assets,
}: DebtFormDialogProps) => {
  const { user } = useAuth();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const archiveDebt = useArchiveDebt();
  const isEditing = Boolean(debt);
  const isPending =
    createDebt.isPending || updateDebt.isPending || archiveDebt.isPending;

  const [archived, setArchived] = useState(debt?.archived ?? false);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: debt?.name ?? "",
      type: debt?.type ?? "loan",
      balance: debt?.balance ?? 0,
      currency: debt?.currency ?? user?.baseCurrency ?? "ARS",
      date: debt?.date ?? todayIso(),
      assetId: debt?.assetId ?? "",
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const TypeIcon = DEBT_TYPE_ICONS[type];
  const firstType = debt?.type ?? "loan";
  const typeOrder = [
    firstType,
    ...DEBT_TYPE_VALUES.filter((value) => value !== firstType),
  ];

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
        if (archived && !debt.archived) {
          await archiveDebt.mutateAsync(debt.id);
        }
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
      description="Podés vincularla a un activo para ver tu patrimonio neto."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear deuda"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto"
    >
      <div className="from-destructive/10 to-background flex w-full min-w-0 flex-col items-center gap-3 rounded-3xl border bg-gradient-to-b p-6 text-center">
        <span className="relative">
          <span className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
            <TypeIcon className="size-8" aria-hidden />
          </span>
          <span className="bg-background absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border">
            <Pencil className="size-3.5" aria-hidden />
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          {DEBT_TYPE_LABELS[type]}
        </span>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  placeholder="Hipoteca"
                  className="h-auto border-0 bg-transparent px-0 text-center font-heading text-xl font-semibold shadow-none focus-visible:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
        <p className="text-muted-foreground text-xs">{HELPER_TEXT[type]}</p>
      </div>

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormLabel>Tipo</FormLabel>
            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {typeOrder.map((value) => {
                const Icon = DEBT_TYPE_ICONS[value];
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
                    {DEBT_TYPE_LABELS[value]}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormMoneyField name="balance" label="Saldo actual" />
        <FormCurrencyField fallback={user?.baseCurrency ?? "ARS"} />
      </div>

      <FormDateField name="date" label="Fecha de actualización" />

      <FormField
        control={form.control}
        name="assetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Activo vinculado</FormLabel>
            <Select
              value={field.value || "none"}
              onValueChange={(value) =>
                field.onChange(value === "none" ? "" : value)
              }
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin vincular" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Sin vincular</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
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
              <span className="text-sm font-medium">Deuda archivada</span>
              <span className="text-muted-foreground text-xs">
                {debt?.archived
                  ? "Esta deuda ya está archivada y no se descuenta."
                  : "Deja de descontarse de tu patrimonio."}
              </span>
            </div>
          </div>
          <Switch
            checked={archived}
            onCheckedChange={setArchived}
            disabled={debt?.archived}
            aria-label="Archivar deuda"
          />
        </div>
      ) : null}
    </FormDialog>
  );
};
