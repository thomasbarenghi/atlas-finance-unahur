import { SectionCard } from "@/components/common/section-card";

const CALCULATION_ROWS: { label: string; value: string }[] = [
  { label: "Cantidad", value: "Editable" },
  { label: "Costo promedio", value: "Editable" },
  { label: "Precio actual", value: "Automático (cotización)" },
  { label: "Valor actual", value: "Calculado" },
  { label: "Resultado", value: "Calculado" },
];

export const PositionCalculationCard = () => (
  <SectionCard
    title="Cómo se calcula"
    description="Qué datos ingresás y cuáles se derivan del mercado."
  >
    <ul className="flex flex-col gap-2 text-sm">
      {CALCULATION_ROWS.map((row) => (
        <li key={row.label} className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium">{row.value}</span>
        </li>
      ))}
    </ul>
  </SectionCard>
);
