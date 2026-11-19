import { Loader2 } from "lucide-react";

export const PageLoader = () => {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2
        className="text-muted-foreground size-6 animate-spin"
        aria-label="Cargando"
      />
    </div>
  );
};
