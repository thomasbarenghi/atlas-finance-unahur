import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { LoginForm } from "@/components/features/auth/login-form";
import { RegisterForm } from "@/components/features/auth/register-form";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";
import { ResetPasswordForm } from "@/components/features/auth/reset-password-form";
import { ApiError } from "@/lib/api/client";
import { mockApi } from "@/lib/mocks/api";
import { renderWithProviders } from "@/lib/test/render";
import { replace, resetNavigationMocks } from "@/lib/test/next-navigation";
import { resetMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("LoginForm", () => {
  const getEmail = () => screen.getByLabelText("Email");
  const getPassword = () => screen.getByLabelText("Contraseña");

  beforeEach(() => {
    resetNavigationMocks();
    resetMockSession();
    vi.restoreAllMocks();
    vi.mocked(toast.error).mockClear();
  });

  it("blocks submit with an invalid email and never calls the API", async () => {
    const user = userEvent.setup();
    const loginSpy = vi.spyOn(mockApi, "login");
    renderWithProviders(<LoginForm />, { user: null });

    await user.type(getEmail(), "not-an-email");
    await user.type(getPassword(), "x");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("Ingresá un email válido"),
    ).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("logs in with valid credentials and redirects to the dashboard", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { user: null });

    await user.type(getEmail(), "demo@atlassfin.app");
    await user.type(getPassword(), "Demo1234!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows the API error and does not navigate on invalid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { user: null });

    await user.type(getEmail(), "demo@atlassfin.app");
    await user.type(getPassword(), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Email o contraseña incorrectos",
      ),
    );
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("RegisterForm", () => {
  beforeEach(() => {
    resetNavigationMocks();
    resetMockSession();
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("rejects mismatched passwords before hitting the API", async () => {
    const user = userEvent.setup();
    const registerSpy = vi.spyOn(mockApi, "register");
    renderWithProviders(<RegisterForm />, { user: null });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Password1");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password2");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("registers and redirects to the dashboard", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { user: null });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Password1");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("redirects to login when the account is pending approval", async () => {
    const user = userEvent.setup();
    vi.spyOn(mockApi, "register").mockResolvedValue({
      pendingApproval: true,
      user: {
        id: "u1",
        name: "Ana",
        email: "ana@example.com",
        baseCurrency: "ARS",
        theme: "system",
        aiEnabled: false,
        assistantDestructiveEnabled: false,
        approvalStatus: "pending",
        createdAt: new Date().toISOString(),
      },
      message: "Tu cuenta quedó pendiente de aprobación.",
    });
    renderWithProviders(<RegisterForm />, { user: null });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Password1");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Tu cuenta quedó pendiente de aprobación.",
      ),
    );
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("surfaces API field errors on the matching input", async () => {
    const user = userEvent.setup();
    vi.spyOn(mockApi, "register").mockRejectedValue(
      new ApiError({
        statusCode: 409,
        code: "EMAIL_IN_USE",
        message: "Ese email ya está registrado",
        fieldErrors: { email: ["Ese email ya está registrado"] },
      }),
    );
    renderWithProviders(<RegisterForm />, { user: null });

    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.type(screen.getByLabelText("Email"), "demo@atlassfin.app");
    await user.type(screen.getByLabelText("Contraseña"), "Password1");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText("Ese email ya está registrado"),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast.error).mockClear();
  });

  it("validates the email", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(mockApi, "forgotPassword");
    renderWithProviders(<ForgotPasswordForm />, { user: null });

    await user.type(screen.getByLabelText("Email"), "nope");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(
      await screen.findByText("Ingresá un email válido"),
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("confirms that the recovery email was requested", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />, { user: null });

    await user.type(screen.getByLabelText("Email"), "demo@atlassfin.app");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(await screen.findByText("Revisá tu correo")).toBeInTheDocument();
  });
});

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    resetNavigationMocks();
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
  });

  it("shows an invalid-link state when the token is missing", () => {
    renderWithProviders(<ResetPasswordForm />, { user: null });
    expect(screen.getByText("Enlace inválido")).toBeInTheDocument();
  });

  it("submits the new password with the token from the URL", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/reset-password?token=reset-token");
    const resetSpy = vi
      .spyOn(mockApi, "resetPassword")
      .mockResolvedValue(undefined);
    renderWithProviders(<ResetPasswordForm />, { user: null });

    await user.type(screen.getByLabelText("Nueva contraseña"), "Password1");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password1");
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    await waitFor(() =>
      expect(resetSpy).toHaveBeenCalledWith({
        token: "reset-token",
        password: "Password1",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
