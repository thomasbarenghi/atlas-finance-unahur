import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/providers/query-provider";
import { PeriodProvider } from "@/providers/period-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AppProviders } from "@/providers/app-providers";
import { useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";
import { testState } from "@/lib/test/api-state";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

setupTestServer();

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
    const { preset, range, setPreset } = usePeriod();
    return (
      <div>
        <span data-testid="preset">{preset}</span>
        <span data-testid="from">{range.from}</span>
        <button type="button" onClick={() => setPreset("last-30-days")}>
          last-30-days
        </button>
        <button type="button" onClick={() => setPreset("12m")}>
          12m
        </button>
      </div>
    );
  };

  it("defaults to the current month and changes preset", async () => {
    const user = userEvent.setup();
    render(
      <PeriodProvider>
        <Probe />
      </PeriodProvider>,
    );
    expect(screen.getByTestId("preset")).toHaveTextContent("month");

    await user.click(screen.getByRole("button", { name: "12m" }));
    expect(screen.getByTestId("preset")).toHaveTextContent("12m");
  });
});

describe("AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("exposes the authenticated user and signs out", async () => {
    const user = userEvent.setup();
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
    await waitFor(() =>
      expect(
        testState.requests.some(
          (request) =>
            request.method === "POST" && request.path.endsWith("/auth/logout"),
        ),
      ).toBe(true),
    );
  });
});

describe("AppProviders", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the provider tree with its children", async () => {
    render(
      <AppProviders>
        <span>Contenido</span>
      </AppProviders>,
    );
    expect(await screen.findByText("Contenido")).toBeInTheDocument();
  });
});
