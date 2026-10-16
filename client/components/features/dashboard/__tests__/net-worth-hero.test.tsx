import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NetWorthHero } from "@/components/features/dashboard/net-worth-hero";
import { makeDashboardData } from "@/lib/test/factories";

const dashboard = makeDashboardData();

describe("NetWorthHero", () => {
  it("renders the value, period stats and the accessible chart", () => {
    render(
      <NetWorthHero
        value={120_000}
        deltaPct={4.2}
        currency="ARS"
        series={dashboard.netWorthSeries}
        income={200_000}
        expenses={80_000}
        savings={120_000}
      />,
    );
    expect(screen.getByText("Patrimonio neto")).toBeInTheDocument();
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Tasa de ahorro")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Evolución del patrimonio neto" }),
    ).toBeInTheDocument();
  });

  it("can hide the period stats", () => {
    render(
      <NetWorthHero
        value={1}
        deltaPct={null}
        currency="ARS"
        series={dashboard.netWorthSeries}
        income={0}
        expenses={0}
        savings={0}
        showPeriodStats={false}
      />,
    );
    expect(screen.queryByText("Ingresos")).toBeNull();
  });
});
