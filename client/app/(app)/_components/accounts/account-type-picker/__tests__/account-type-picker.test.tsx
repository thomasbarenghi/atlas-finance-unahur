import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountTypePicker } from "@/app/(app)/_components/accounts/account-type-picker";

describe("AccountTypePicker", () => {
  it("uses the type choice as the action and has no footer", () => {
    render(
      <AccountTypePicker open onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /Billetera/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });
});
