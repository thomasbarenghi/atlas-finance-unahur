import { StrictMode, type ReactElement, type ReactNode } from "react";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { AuthContext, type AuthContextValue } from "@/hooks/use-auth";
import { PeriodContext, type PeriodContextValue } from "@/hooks/use-period";
import {
  ReadingCurrencyContext,
  type ReadingCurrencyContextValue,
} from "@/hooks/use-reading-currency";
import { ThemeProvider } from "next-themes";
import type { PeriodRange, User } from "@/lib/api/types";
import { makeUser } from "./factories";

export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 5 * 60_000, staleTime: 0 },
      mutations: { retry: false },
    },
  });

const defaultPeriod: PeriodRange = { from: "2026-01-01", to: "2026-01-31" };

export const makeAuthValue = (
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue => ({
  user: makeUser(),
  isLoading: false,
  isSigningOut: false,
  signOut: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makePeriodValue = (
  overrides: Partial<PeriodContextValue> = {},
): PeriodContextValue => ({
  preset: "month",
  range: defaultPeriod,
  setPreset: vi.fn(),
  ...overrides,
});

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  "wrapper"
> {
  user?: User | null;
  auth?: Partial<AuthContextValue>;
  period?: PeriodRange;
  readingCurrency?: string;
  queryClient?: QueryClient;
  /**
   * Renders under `StrictMode` as the root element. React only double-invokes
   * effects when `StrictMode` is the root of the rendered tree (not nested).
   */
  strict?: boolean;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) => {
  const {
    user,
    auth,
    period = defaultPeriod,
    readingCurrency,
    queryClient = createTestQueryClient(),
    strict = false,
    ...renderOptions
  } = options;

  const authValue = makeAuthValue({ user, ...auth });
  const periodValue = makePeriodValue({ range: period });
  const readingCurrencyValue: ReadingCurrencyContextValue = {
    currency: readingCurrency,
    setCurrency: vi.fn(),
  };

  const providers = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <PeriodContext.Provider value={periodValue}>
          <ReadingCurrencyContext.Provider value={readingCurrencyValue}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              storageKey="atlassfin.preferences.theme"
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </ReadingCurrencyContext.Provider>
        </PeriodContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  if (strict) {
    return {
      queryClient,
      ...render(<StrictMode>{providers(ui)}</StrictMode>, renderOptions),
    };
  }

  const wrapper = ({ children }: { children: ReactNode }) =>
    providers(children);

  return { queryClient, ...render(ui, { wrapper, ...renderOptions }) };
};

export const renderHookWithProviders = <Result, Props>(
  callback: (props: Props) => Result,
  options: RenderWithProvidersOptions = {},
) => {
  const {
    user,
    auth,
    period = defaultPeriod,
    readingCurrency,
    queryClient = createTestQueryClient(),
  } = options;

  const authValue = makeAuthValue({ user, ...auth });
  const periodValue = makePeriodValue({ range: period });
  const readingCurrencyValue: ReadingCurrencyContextValue = {
    currency: readingCurrency,
    setCurrency: vi.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <PeriodContext.Provider value={periodValue}>
          <ReadingCurrencyContext.Provider value={readingCurrencyValue}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              storageKey="atlassfin.preferences.theme"
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </ReadingCurrencyContext.Provider>
        </PeriodContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return { queryClient, ...renderHook(callback, { wrapper }) };
};
