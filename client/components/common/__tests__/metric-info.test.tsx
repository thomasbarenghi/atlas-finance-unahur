import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MetricInfo } from "@/components/common/metric-info";
import { renderWithProviders } from "@/lib/test/render";

describe("MetricInfo", () => {
  it("shows only the formula and example and closes with Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MetricInfo
        label="Tasa de ahorro"
        formula="Ahorro ÷ ingresos × 100"
        description="Con $ 2.910.000 de ingresos y $ 433.000 de gastos, da 85,1%."
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Información sobre Tasa de ahorro",
    });
    const describedBy = trigger.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Ahorro ÷ ingresos × 100",
    );

    await user.click(trigger);
    expect(
      await screen.findByText("Ahorro ÷ ingresos × 100"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Con $ 2.910.000 de ingresos y $ 433.000 de gastos, da 85,1%.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CAL-004/)).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByText("Ahorro ÷ ingresos × 100")).toBeNull(),
    );
  });

  it("keeps only one tooltip open at a time", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <MetricInfo
          label="Ahorro"
          formula="Fórmula del ahorro"
          description="Ejemplo del ahorro."
        />
        <MetricInfo
          label="Tasa de ahorro"
          formula="Fórmula de la tasa"
          description="Ejemplo de la tasa."
        />
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: "Información sobre Ahorro" }),
    );
    expect(await screen.findByText("Fórmula del ahorro")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Información sobre Tasa de ahorro" }),
    );
    expect(await screen.findByText("Fórmula de la tasa")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Fórmula del ahorro")).toBeNull(),
    );
  });
});
