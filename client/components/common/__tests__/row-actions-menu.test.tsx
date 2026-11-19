import { Trash2 } from "lucide-react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { renderWithProviders } from "@/lib/test/render";

describe("RowActionsMenu", () => {
  it("opens the actions from the trigger as a dropdown, not a sheet", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderWithProviders(
      <RowActionsMenu
        label="Caja"
        actions={[
          {
            label: "Eliminar",
            icon: Trash2,
            variant: "destructive",
            onSelect: onDelete,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Acciones de Caja" }));
    await user.click(await screen.findByRole("menuitem", { name: /Eliminar/ }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
