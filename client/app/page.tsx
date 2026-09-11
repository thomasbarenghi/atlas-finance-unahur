"use client";

import {
  ArrowRight,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercent } from "@/lib/format";

const kpis = [
  { label: "Patrimonio neto", value: 48500000, delta: 0.034, icon: Wallet },
  {
    label: "Ingresos del mes",
    value: 1250000,
    delta: 0.051,
    icon: TrendingUp,
  },
  { label: "Gastos del mes", value: 840000, delta: -0.02, icon: TrendingDown },
  { label: "Ahorro del mes", value: 410000, delta: 0.12, icon: PiggyBank },
];

const budgets = [
  { name: "Comida", consumed: 81, status: "Advertencia", tone: "warning" },
  { name: "Transporte", consumed: 42, status: "Disponible", tone: "success" },
  { name: "Servicios", consumed: 118, status: "Excedido", tone: "destructive" },
];

const Home = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6 lg:py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl font-heading text-lg font-bold">
            A
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-lg leading-none font-semibold">
              Atlass Fin
            </span>
            <span className="text-muted-foreground text-xs">
              Gestor financiero personal
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-col items-start gap-5">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" /> Demo de componentes
        </Badge>
        <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Tu dinero, más claro.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Cuentas, movimientos, presupuestos, activos y reportes con analítica y
          un asistente que responde sobre tus propios datos. Probalo en modo
          claro y oscuro.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">
            <Plus /> Crear movimiento
          </Button>
          <Button size="lg" variant="outline">
            Ver reportes <ArrowRight />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const positive = kpi.delta >= 0;

          return (
            <Card key={kpi.label}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  <Icon className="text-muted-foreground size-4" />
                </div>
                <CardTitle className="font-heading text-2xl">
                  {formatCurrency(kpi.value, "ARS")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={
                    positive
                      ? "text-success text-sm font-medium"
                      : "text-destructive text-sm font-medium"
                  }
                >
                  {positive ? "+" : ""}
                  {formatPercent(kpi.delta)} vs. mes anterior
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Presupuestos</CardTitle>
            <CardDescription>
              Estados con color, texto e ícono (no solo color).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {budgets.map((budget) => (
              <div key={budget.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{budget.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      budget.tone === "success"
                        ? "border-success/30 text-success"
                        : budget.tone === "warning"
                          ? "border-warning/30 text-warning"
                          : "border-destructive/30 text-destructive"
                    }
                  >
                    {budget.status}
                  </Badge>
                </div>
                <Progress value={Math.min(budget.consumed, 100)} />
                <span className="text-muted-foreground text-xs">
                  {budget.consumed}% consumido
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Componentes</CardTitle>
            <CardDescription>
              Variantes de botones, badges y pestañas del preset.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Button>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructivo</Button>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Badge>Badge</Badge>
              <Badge variant="secondary">Secundario</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-success/10 text-success">Positivo</Badge>
              <Badge className="bg-warning/10 text-warning">Advertencia</Badge>
              <Badge className="bg-destructive/10 text-destructive">
                Negativo
              </Badge>
            </div>
            <Separator />
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="movements">Movimientos</TabsTrigger>
              </TabsList>
              <TabsContent
                value="summary"
                className="text-muted-foreground pt-3 text-sm"
              >
                Los ingresos superan a los gastos por{" "}
                {formatCurrency(410000, "ARS")} este mes.
              </TabsContent>
              <TabsContent
                value="movements"
                className="text-muted-foreground pt-3 text-sm"
              >
                Último movimiento: Supermercado −{formatCurrency(12000, "ARS")}.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section className="bg-muted/40 flex flex-col gap-3 rounded-2xl border p-6">
        <h2 className="font-heading text-xl font-semibold">
          Tipografías del proyecto
        </h2>
        <p className="text-muted-foreground text-sm">
          Los títulos usan <strong>Outfit</strong>; el cuerpo de texto usa{" "}
          <strong>Nunito</strong>. Este párrafo está en Nunito.
        </p>
      </section>

      <footer className="text-muted-foreground border-t pt-6 text-sm">
        Hecho con Next.js, shadcn/ui, Tailwind y Capacitor · Proyecto
        universitario UNAHUR
      </footer>
    </div>
  );
};

export default Home;
