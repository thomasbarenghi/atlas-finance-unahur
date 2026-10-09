import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssistantActionCard } from "@/components/features/assistant/assistant-action-card";
import { makeAssistantAction } from "@/lib/test/factories";

const renderCard = (
  overrides: Parameters<typeof makeAssistantAction>[0] = {},
  props: {
    locked?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = {},
) => {
  const onConfirm = props.onConfirm ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();
  const view = render(
    <AssistantActionCard
      action={makeAssistantAction(overrides)}
      locked={props.locked}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { ...view, onConfirm, onCancel };
};

describe("AssistantActionCard", () => {
  it("renders a safe proposal with fields, impact and confirm/cancel", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderCard();

    expect(screen.getByText("Crear movimiento")).toBeInTheDocument();
    expect(screen.getByText("Requiere tu confirmación")).toBeInTheDocument();
    expect(screen.getByText("Monto")).toBeInTheDocument();
    expect(screen.getByText("100 ARS")).toBeInTheDocument();
    expect(
      screen.getByText("Afecta tu presupuesto de Comida"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledWith("action-1");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledWith("action-1");
  });

  it("uses the destructive label for dangerous actions", () => {
    renderCard({ destructive: true });
    expect(
      screen.getByRole("button", { name: "Eliminar" }),
    ).toBeInTheDocument();
  });

  it("marks a pending dependency as locked", () => {
    renderCard({ pending: true }, { locked: true });
    expect(screen.getByText("Depende de otra acción")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(
      screen.getByText("Confirmá primero el paso anterior."),
    ).toBeInTheDocument();
  });

  it("shows the plan step when part of a plan", () => {
    renderCard({ planId: "plan-1", step: 1 });
    expect(screen.getByText("Paso 2")).toBeInTheDocument();
  });

  it("renders executing, executed and cancelled states", () => {
    const executing = renderCard({ status: "executing" });
    expect(screen.getByText("Ejecutando…")).toBeInTheDocument();
    executing.unmount();

    const executed = renderCard({
      status: "executed",
      resultSummary: "Creado",
    });
    expect(screen.getByText("Listo")).toBeInTheDocument();
    expect(screen.getByText("Creado")).toBeInTheDocument();
    executed.unmount();

    renderCard({
      status: "cancelled",
      resultSummary: "Cancelada por el usuario",
    });
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("Cancelada por el usuario")).toBeInTheDocument();
  });

  it("offers a retry for failed actions with a token", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderCard({
      status: "failed",
      resultSummary: "Monto inválido",
    });
    expect(screen.getByText("No se pudo completar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
