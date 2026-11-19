import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Brand } from "@/components/layout/brand";

const BENEFITS = [
  "Todas tus cuentas en una vista",
  "Categorías y control del gasto",
  "Asistente que responde con tus datos",
];

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background grid min-h-dvh lg:grid-cols-[600px_1fr]">
      <aside
        className="relative hidden flex-col p-12 lg:flex"
        style={{ backgroundImage: "var(--hero-gradient)" }}
      >
        <Brand wordmarkClassName="lg:text-[21px]" />
        <div className="my-auto flex max-w-[440px] flex-col gap-4">
          <span className="text-primary text-[10px] font-bold tracking-[0.16em]">
            FINANZAS PERSONALES
          </span>
          <h1 className="font-heading text-foreground text-[42px] leading-[1.05] font-semibold tracking-tight">
            Tus finanzas, en orden.
          </h1>
          <p className="text-ink2 max-w-[380px] text-[13.5px] leading-relaxed">
            Ingresos, gastos y ahorro en un solo lugar. Sin planillas y sin
            adivinar a fin de mes.
          </p>
          <ul className="mt-6 flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="text-ink2 flex items-center gap-2 text-[11.5px]"
              >
                <span className="text-primary flex size-4 items-center justify-center rounded-full border border-primary/20">
                  <Check className="size-2.5" aria-hidden />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-5 py-8 lg:items-center lg:justify-center">
        <div className="mb-8 flex items-center justify-center lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center lg:flex-none">
          {children}
        </div>
        <p className="text-muted-foreground mt-8 text-center text-[10px] lg:hidden">
          Proyecto universitario UNAHUR · Datos de demostración
        </p>
      </main>
    </div>
  );
};

export default AuthLayout;
