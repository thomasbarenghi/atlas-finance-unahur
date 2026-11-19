import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NetWorthHero } from "@/app/(app)/dashboard/_components/net-worth-hero";
import { makeDashboardData } from "@/lib/test/factories";

const dashboard = makeDashboardData();

describe("NetWorthHero", () => {
  it("renders the value, period stats and the accessible chart", () => {
    render(
      <NetWorthHero
        value={120_000}
        deltaPct={4.2}
        currency="ARS"
        breakdown={dashboard.breakdown}
        series={dashboard.netWorthSeries}
        income={200_000}
        expenses={80_000}
        savings={120_000}
      />,
    );
    expect(screen.getByText("Patrimonio neto")).toBeInTheDocument();
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Tasa de ahorro")).toBeInTheDocument();
    expect(screen.getByText("desde el inicio del período")).toBeInTheDocument();
    expect(screen.queryByText("Ver desglose")).not.toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Evolución del patrimonio neto" }),
    ).toBeInTheDocument();
  });

  it("hides the currency chips when all accounts use the primary currency", () => {
    render(
      <NetWorthHero
        value={120_000}
        deltaPct={4.2}
        currency="ARS"
        breakdown={[
          {
            currency: "ARS",
            balance: 120_000,
            accounts: 3,
            converted: 120_000,
          },
        ]}
        series={dashboard.netWorthSeries}
        income={200_000}
        expenses={80_000}
        savings={120_000}
      />,
    );
    expect(screen.queryByText("USD")).not.toBeInTheDocument();
    expect(screen.queryByText("Ver desglose")).not.toBeInTheDocument();
  });
});
