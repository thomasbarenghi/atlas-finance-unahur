import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeView } from "@/components/features/home/home-view";
import { AccountsSection } from "@/components/features/home/accounts-section";
import { InvestmentsSection } from "@/components/features/home/investments-section";
import { mockApi } from "@/lib/mocks/api";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));

describe("HomeView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("renders the net worth hero with the dashboard data", async () => {
    renderWithProviders(<HomeView />);
    expect(screen.getByText("Tu resumen")).toBeInTheDocument();
    expect(await screen.findByText("Patrimonio neto")).toBeInTheDocument();
  });

  it("shows skeletons while the dashboard is loading", async () => {
    vi.spyOn(mockApi, "dashboard").mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<HomeView />);
    await waitFor(() =>
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0),
    );
  });

  it("shows an error state with retry when the dashboard fails", async () => {
    const spy = vi
      .spyOn(mockApi, "dashboard")
      .mockRejectedValue(new Error("network"));
    renderWithProviders(<HomeView />);
    expect(
      await screen.findByText("No pudimos cargar la información"),
    ).toBeInTheDocument();

    const callsBefore = spy.mock.calls.length;
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() =>
      expect(spy.mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });
});

describe("AccountsSection", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("lists accounts and goals with their source account", async () => {
    renderWithProviders(<AccountsSection />);
    expect(screen.getByText("Cuentas")).toBeInTheDocument();
    expect(await screen.findByText("Banco ARS")).toBeInTheDocument();
    expect(screen.getByText("Ahorro USD")).toBeInTheDocument();
    expect(screen.getByText("Metas")).toBeInTheDocument();
    expect(await screen.findByText("Vacaciones")).toBeInTheDocument();
  });

  it("opens the account type picker and then the account form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsSection />);

    await user.click(screen.getByRole("button", { name: "Nueva cuenta" }));
    expect(
      await screen.findByText(/Elegí qué querés crear/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Efectivo/ }));

    expect(
      await screen.findByText("Definí el nombre, el tipo y el saldo."),
    ).toBeInTheDocument();
  });

  it("opens the goal form from the goals header", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsSection />);

    await user.click(screen.getByRole("button", { name: "Nueva meta" }));
    expect(
      await screen.findByText(
        "Asociá la meta a la cuenta donde vive el dinero.",
      ),
    ).toBeInTheDocument();
  });
});

describe("InvestmentsSection", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("lists assets, financial investments and debts", async () => {
    renderWithProviders(<InvestmentsSection />);
    expect(screen.getByText("Patrimonio")).toBeInTheDocument();
    expect(await screen.findByText("Departamento")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("Inversiones financieras")).toBeInTheDocument();
    expect((await screen.findAllByText(/BTC/)).length).toBeGreaterThan(0);
    expect(screen.getByText("Deudas")).toBeInTheDocument();
    expect(await screen.findByText("Hipoteca")).toBeInTheDocument();
  });

  it("opens the picker and the position form for a new investment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InvestmentsSection />);

    await user.click(
      screen.getByRole("button", { name: "Nuevo activo, inversión o deuda" }),
    );
    expect(
      await screen.findByText("¿Qué querés agregar a tu patrimonio?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Inversión/ }));

    expect(
      await screen.findByText(
        "Se valúa con el último precio de mercado disponible.",
      ),
    ).toBeInTheDocument();
  });

  it("opens the asset form from the picker", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InvestmentsSection />);

    await user.click(
      screen.getByRole("button", { name: "Nuevo activo, inversión o deuda" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /Activo/ }));
    expect(
      await screen.findByText(
        "Cargá el bien y su valor para sumarlo a tu patrimonio.",
      ),
    ).toBeInTheDocument();
  });

  it("opens the debt form from the picker", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InvestmentsSection />);

    await user.click(
      screen.getByRole("button", { name: "Nuevo activo, inversión o deuda" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /Deuda/ }));
    expect(
      await screen.findByText(
        "Podés vincularla a un activo para ver tu patrimonio neto.",
      ),
    ).toBeInTheDocument();
  });

  it("links to the investments report", async () => {
    renderWithProviders(<InvestmentsSection />);
    const link = await screen.findByRole("link", { name: /Ver reportes/ });
    expect(link).toHaveAttribute("href", "/reports/investments");
  });
});
