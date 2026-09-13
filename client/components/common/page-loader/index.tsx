import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageLoaderProps {
  className?: string;
}

export const PageLoader = ({ className }: PageLoaderProps) => {
  return (
    <div
      className={cn("flex min-h-dvh items-center justify-center", className)}
    >
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-label="Cargando"
      />
    </div>
  );
};
