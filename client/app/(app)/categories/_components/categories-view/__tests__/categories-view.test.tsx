import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesView } from "@/app/(app)/categories/_components/categories-view";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

setupTestServer();

describe("CategoriesView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("labels the shared period like the dashboard", () => {
    renderWithProviders(<CategoriesView />, {
      user: makeUser(),
      period: { from: "2026-10-01", to: "2026-10-26" },
    });

    expect(screen.getByRole("combobox", { name: "Período" })).toHaveTextContent(
      "Este mes",
    );
  });
});
