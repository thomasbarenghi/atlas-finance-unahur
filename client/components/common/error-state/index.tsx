import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = "No pudimos cargar la información",
  description = "Revisá tu conexión e intentá de nuevo.",
  onRetry,
}: ErrorStateProps) => {
  return (
    <EmptyState
      icon={TriangleAlert}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        ) : undefined
      }
    />
  );
};
