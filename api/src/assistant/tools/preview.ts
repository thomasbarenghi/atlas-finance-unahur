import type { ActionPreviewField } from "./tool.types";

/**
 * Etiquetas legibles (español) para las claves de argumentos de las tools. Evita
 * exponer claves internas en inglés en las tarjetas de confirmación y unifica
 * el vocabulario entre tools y acciones diferidas.
 */
export const FIELD_LABELS: Record<string, string> = {
  account: "Cuenta",
  accountId: "Cuenta",
  fromAccount: "Cuenta origen",
  toAccount: "Cuenta destino",
  category: "Categoría",
  categoryId: "Categoría",
  asset: "Activo",
  assetId: "Activo",
  debt: "Deuda",
  debtId: "Deuda",
  position: "Inversión",
  positionId: "Inversión",
  goal: "Meta",
  goalId: "Meta",
  budgetId: "Presupuesto",
  transactionId: "Movimiento",
  name: "Nombre",
  amount: "Monto",
  balance: "Saldo",
  limit: "Límite",
  date: "Fecha",
  targetDate: "Fecha objetivo",
  targetAmount: "Objetivo",
  savedAmount: "Acumulado",
  sourceAccount: "Cuenta origen",
  sourceAccountId: "Cuenta origen",
  sourcePeriod: "Período origen",
  currency: "Moneda",
  description: "Descripción",
  instrument: "Instrumento",
  initialBalance: "Saldo inicial",
  initialValue: "Valor inicial",
  avgCost: "Costo promedio",
  quantity: "Cantidad",
  unitPrice: "Precio unitario",
  symbol: "Símbolo",
  value: "Valor",
  period: "Período",
  type: "Tipo",
  notes: "Notas",
  recurring: "Renovación",
  icon: "Ícono",
  color: "Color",
  theme: "Tema",
  aiEnabled: "Asistente habilitado",
};

const formatValue = (value: unknown): string => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
};

/**
 * Construye los campos de una vista previa a partir de un objeto de cambios,
 * descartando los valores vacíos (`undefined`/`null`/`""`). Necesario porque las
 * instancias de DTO declaran todas sus propiedades (el resto queda en
 * `undefined`) y no deben mostrarse como "undefined" en la tarjeta.
 */
export const definedPreviewFields = (record: object): ActionPreviewField[] =>
  Object.entries(record)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => ({
      label: FIELD_LABELS[key] ?? key,
      value: formatValue(value),
    }));
