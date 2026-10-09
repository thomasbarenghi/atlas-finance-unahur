import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import { PeriodProvider } from "@/providers/period-provider";
import { DisplayCurrencyProvider } from "@/providers/display-currency-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AppProviders } from "@/providers/app-providers";
import { AuthContext, useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { mockApi } from "@/lib/mocks/api";
import { makeUser } from "@/lib/test/factories";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

describe("QueryProvider", () => {
  it("provides a query client to its children", () => {
    render(
      <QueryProvider>
        <span>Hijo</span>
      </QueryProvider>,
    );
    expect(screen.getByText("Hijo")).toBeInTheDocument();
  });
});

describe("PeriodProvider", () => {
  const Probe = () => {
    const { preset, range, setPreset, setCustomRange } = usePeriod();
    return (
      <div>
        <span data-testid="preset">{preset}</span>
        <span data-testid="from">{range.from}</span>
        <button type="button" onClick={() => setPreset("custom")}>
          custom
        </button>
        <button
          type="button"
          onClick={() =>
            setCustomRange({ from: "2026-01-01", to: "2026-01-31" })
          }
        >
          range
        </button>
      </div>
    );
  };

  it("defaults to 6m and honours custom presets and ranges", async () => {
    const user = userEvent.setup();
    render(
      <PeriodProvider>
        <Probe />
      </PeriodProvider>,
    );
    expect(screen.getByTestId("preset")).toHaveTextContent("6m");

    await user.click(screen.getByRole("button", { name: "custom" }));
    expect(screen.getByTestId("preset")).toHaveTextContent("custom");

    await user.click(screen.getByRole("button", { name: "range" }));
    expect(screen.getByTestId("from")).toHaveTextContent("2026-01-01");
  });
});

describe("DisplayCurrencyProvider", () => {
  const Probe = () => {
    const { currency } = useDisplayCurrency();
    return <span data-testid="currency">{currency}</span>;
  };

  const authValue = (baseCurrency: string | null) => ({
    user: baseCurrency ? makeUser({ baseCurrency }) : null,
    isLoading: false,
    isSigningOut: false,
    signOut: vi.fn(),
  });

  it("uses the user's base currency and falls back to ARS", () => {
    const { unmount } = render(
      <AuthContext.Provider value={authValue("USD")}>
        <DisplayCurrencyProvider>
          <Probe />
        </DisplayCurrencyProvider>
      </AuthContext.Provider>,
    );
    expect(screen.getByTestId("currency")).toHaveTextContent("USD");
    unmount();

    render(
      <AuthContext.Provider value={authValue(null)}>
        <DisplayCurrencyProvider>
          <Probe />
        </DisplayCurrencyProvider>
      </AuthContext.Provider>,
    );
    expect(screen.getByTestId("currency")).toHaveTextContent("ARS");
  });
});

describe("AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("exposes the authenticated user and signs out", async () => {
    const user = userEvent.setup();
    const logoutSpy = vi.spyOn(mockApi, "logout").mockResolvedValue(undefined);
    const Probe = () => {
      const { user: current, isLoading, signOut } = useAuth();
      return (
        <div>
          <span data-testid="email">{current?.email ?? "none"}</span>
          <span data-testid="loading">{String(isLoading)}</span>
          <button type="button" onClick={() => void signOut()}>
            salir
          </button>
        </div>
      );
    };

    render(
      <QueryProvider>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </QueryProvider>,
    );

    expect(await screen.findByText("demo@atlassfin.app")).toBeInTheDocument();
    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "salir" }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });
});

describe("AppProviders", () => {
  beforeEach(() => {
    window.localStorage.clear();
    seedMockSession();
  });
  afterEach(() => resetMockSession());

  it("renders the provider tree with its children", async () => {
    render(
      <AppProviders>
        <span>Contenido</span>
      </AppProviders>,
    );
    expect(await screen.findByText("Contenido")).toBeInTheDocument();
  });
});
