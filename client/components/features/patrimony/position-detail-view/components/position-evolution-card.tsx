import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SectionCard } from "@/components/common/section-card";

export const PositionEvolutionCard = () => (
  <SectionCard
    title="Evolución"
    description="Precio de la posición a lo largo del tiempo."
  >
    <EmptyState
      icon={TrendingUp}
      title="Sin historial de mercado"
      description="Todavía no hay series históricas de este instrumento. Se van a mostrar cuando estén disponibles."
    />
  </SectionCard>
);
