import type { ReactElement } from "react";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { AuthContext, type AuthContextValue } from "@/hooks/use-auth";
import { PeriodContext, type PeriodContextValue } from "@/hooks/use-period";
import { DisplayCurrencyContext } from "@/hooks/use-display-currency";
import {
  AssistantChatContext,
  type AssistantChatContextValue,
} from "@/hooks/use-assistant-chat";
import { AssistantPanelContext } from "@/hooks/use-assistant-panel";
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
  setCustomRange: vi.fn(),
  ...overrides,
});

const makeAssistantChatValue = (): AssistantChatContextValue => ({
  threads: [],
  activeThread: null,
  setConversationId: vi.fn(),
  appendMessage: vi.fn(),
  updateMessage: vi.fn(),
  startNewThread: vi.fn(),
  selectThread: vi.fn(),
  deleteThread: vi.fn(),
});

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  "wrapper"
> {
  user?: User | null;
  auth?: Partial<AuthContextValue>;
  period?: PeriodRange;
  currency?: string;
  queryClient?: QueryClient;
  assistantChat?: AssistantChatContextValue;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) => {
  const {
    user,
    auth,
    period = defaultPeriod,
    currency = "ARS",
    queryClient = createTestQueryClient(),
    assistantChat = makeAssistantChatValue(),
    ...renderOptions
  } = options;

  const authValue = makeAuthValue({ user, ...auth });
  const periodValue = makePeriodValue({ range: period });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <PeriodContext.Provider value={periodValue}>
          <DisplayCurrencyContext.Provider value={{ currency }}>
            <AssistantPanelContext.Provider
              value={{
                isOpen: false,
                open: vi.fn(),
                close: vi.fn(),
                toggle: vi.fn(),
              }}
            >
              <AssistantChatContext.Provider value={assistantChat}>
                {children}
              </AssistantChatContext.Provider>
            </AssistantPanelContext.Provider>
          </DisplayCurrencyContext.Provider>
        </PeriodContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

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
    currency = "ARS",
    queryClient = createTestQueryClient(),
    assistantChat = makeAssistantChatValue(),
  } = options;

  const authValue = makeAuthValue({ user, ...auth });
  const periodValue = makePeriodValue({ range: period });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <PeriodContext.Provider value={periodValue}>
          <DisplayCurrencyContext.Provider value={{ currency }}>
            <AssistantChatContext.Provider value={assistantChat}>
              {children}
            </AssistantChatContext.Provider>
          </DisplayCurrencyContext.Provider>
        </PeriodContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return { queryClient, ...renderHook(callback, { wrapper }) };
};
