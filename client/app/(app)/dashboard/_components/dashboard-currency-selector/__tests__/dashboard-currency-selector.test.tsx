import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardCurrencySelector } from "@/app/(app)/dashboard/_components/dashboard-currency-selector";

describe("DashboardCurrencySelector", () => {
  it("is hidden when there is only one currency in use", () => {
    render(
      <DashboardCurrencySelector
        value="ARS"
        options={["ARS"]}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Moneda de lectura" }),
    ).not.toBeInTheDocument();
  });

  it("changes the reading currency and can open the full catalog", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onOther = vi.fn();
    render(
      <DashboardCurrencySelector
        value="ARS"
        options={["ARS", "USD"]}
        onChange={onChange}
        onOther={onOther}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Moneda de lectura" }));
    await user.click(await screen.findByRole("button", { name: "USD" }));
    expect(onChange).toHaveBeenCalledWith("USD");

    await user.click(screen.getByRole("button", { name: "Moneda de lectura" }));
    await user.click(
      await screen.findByRole("button", { name: "Otra moneda" }),
    );
    expect(onOther).toHaveBeenCalled();
  });
});
