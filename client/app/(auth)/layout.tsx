import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      <div className="from-primary/20 pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b to-transparent" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-10">
        <div className="flex flex-col items-center gap-3 pt-4">
          <span className="bg-primary text-primary-foreground font-heading flex size-16 items-center justify-center rounded-3xl text-3xl font-bold shadow-lg shadow-primary/20">
            A
          </span>
          <div className="flex flex-col items-center">
            <span className="font-heading text-lg font-semibold">
              Atlass Fin
            </span>
            <span className="text-muted-foreground text-xs">
              Gestor financiero
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          {children}
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Proyecto universitario UNAHUR · Datos de demostración
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
