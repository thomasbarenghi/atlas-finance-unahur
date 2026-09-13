export type DashboardWidgetId =
  "netWorth" | "incomeExpense" | "categoryDonut" | "budgetUsage";

export interface DashboardLayout {
  columns: DashboardWidgetId[][];
  hidden: DashboardWidgetId[];
  spans: Record<DashboardWidgetId, number>;
}

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  label: string;
  description: string;
  weight: number;
  maxSpan: number;
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    id: "netWorth",
    label: "Patrimonio neto",
    description: "Valor, variación y evolución del período.",
    weight: 3,
    maxSpan: 3,
  },
  {
    id: "incomeExpense",
    label: "Ingresos vs. gastos",
    description: "Comparación mensual del período.",
    weight: 4,
    maxSpan: 1,
  },
  {
    id: "categoryDonut",
    label: "Gastos por categoría",
    description: "Distribución del gasto en el período.",
    weight: 5,
    maxSpan: 1,
  },
  {
    id: "budgetUsage",
    label: "Presupuesto mensual",
    description: "Uso actual de tus presupuestos del mes.",
    weight: 4,
    maxSpan: 1,
  },
];

export const MAX_DASHBOARD_COLUMNS = 3;

export const dashboardWidgetLabel = (id: DashboardWidgetId): string =>
  DASHBOARD_WIDGETS.find((widget) => widget.id === id)?.label ?? id;

export const dashboardWidgetWeight = (id: DashboardWidgetId): number =>
  DASHBOARD_WIDGETS.find((widget) => widget.id === id)?.weight ?? 4;

export const dashboardWidgetMaxSpan = (id: DashboardWidgetId): number =>
  DASHBOARD_WIDGETS.find((widget) => widget.id === id)?.maxSpan ?? 1;

export const clampWidgetSpan = (
  id: DashboardWidgetId,
  span: unknown,
): number => {
  const max = dashboardWidgetMaxSpan(id);
  const value =
    typeof span === "number" && !Number.isNaN(span) ? Math.round(span) : 1;
  return Math.max(1, Math.min(max, value));
};

const isKnownWidgetId = (value: unknown): value is DashboardWidgetId =>
  DASHBOARD_WIDGETS.some((widget) => widget.id === value);

const DEFAULT_SPANS: Record<DashboardWidgetId, number> = {
  netWorth: 3,
  incomeExpense: 1,
  categoryDonut: 1,
  budgetUsage: 1,
};

const defaultSpans = (): Record<DashboardWidgetId, number> => ({
  ...DEFAULT_SPANS,
});

const emptyColumns = (): DashboardWidgetId[][] =>
  Array.from({ length: MAX_DASHBOARD_COLUMNS }, () => []);

const distributeBalanced = (
  ids: DashboardWidgetId[],
): DashboardWidgetId[][] => {
  const columns = emptyColumns();
  const weights = Array.from({ length: MAX_DASHBOARD_COLUMNS }, () => 0);

  for (const id of ids) {
    let target = 0;
    for (let index = 1; index < MAX_DASHBOARD_COLUMNS; index += 1) {
      if (weights[index] < weights[target]) target = index;
    }
    columns[target].push(id);
    weights[target] += dashboardWidgetWeight(id) + 1;
  }

  return columns;
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  columns: distributeBalanced(DASHBOARD_WIDGETS.map((widget) => widget.id)),
  hidden: [],
  spans: defaultSpans(),
};

const parseSpans = (value: unknown): Record<DashboardWidgetId, number> => {
  const spans = defaultSpans();
  if (typeof value === "object" && value !== null) {
    for (const widget of DASHBOARD_WIDGETS) {
      const raw = (value as Record<string, unknown>)[widget.id];
      if (raw !== undefined) {
        spans[widget.id] = clampWidgetSpan(widget.id, raw);
      }
    }
  }
  return spans;
};

export const normalizeDashboardLayout = (value: unknown): DashboardLayout => {
  const known = new Set<DashboardWidgetId>();
  const hidden: DashboardWidgetId[] = [];
  const spans =
    typeof value === "object" && value !== null
      ? parseSpans((value as { spans?: unknown }).spans)
      : defaultSpans();

  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { columns?: unknown }).columns)
  ) {
    const columns = emptyColumns();
    const rawColumns = (value as { columns: unknown[] }).columns;
    rawColumns.forEach((rawColumn, columnIndex) => {
      if (!Array.isArray(rawColumn) || columnIndex >= MAX_DASHBOARD_COLUMNS) {
        return;
      }
      for (const entry of rawColumn) {
        if (isKnownWidgetId(entry) && !known.has(entry)) {
          known.add(entry);
          columns[columnIndex].push(entry);
        }
      }
    });

    const rawHidden = (value as { hidden?: unknown }).hidden;
    if (Array.isArray(rawHidden)) {
      for (const entry of rawHidden) {
        if (isKnownWidgetId(entry) && !known.has(entry)) {
          known.add(entry);
          hidden.push(entry);
        }
      }
    }

    for (const widget of DASHBOARD_WIDGETS) {
      if (known.has(widget.id)) continue;
      known.add(widget.id);
      const lengths = columns.map((column) => column.length);
      let target = 0;
      for (let index = 1; index < lengths.length; index += 1) {
        if (lengths[index] < lengths[target]) target = index;
      }
      columns[target].push(widget.id);
    }

    return { columns, hidden, spans };
  }

  const visible: DashboardWidgetId[] = [];
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry !== "object" || entry === null) continue;
      const id = (entry as { id?: unknown }).id;
      if (!isKnownWidgetId(id) || known.has(id)) continue;
      known.add(id);
      if (Boolean((entry as { hidden?: unknown }).hidden)) hidden.push(id);
      else visible.push(id);
    }
  }

  for (const widget of DASHBOARD_WIDGETS) {
    if (!known.has(widget.id)) {
      known.add(widget.id);
      visible.push(widget.id);
    }
  }

  return { columns: distributeBalanced(visible), hidden, spans };
};
