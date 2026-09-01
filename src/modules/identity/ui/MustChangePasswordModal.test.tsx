import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MustChangePasswordModal } from "./MustChangePasswordModal";
import * as authGateway from "@/modules/identity/infrastructure/auth.gateway";

vi.mock("@/modules/identity/infrastructure/auth.gateway", () => ({
  changePassword: vi.fn(),
  fetchCurrentAgent: vi.fn(),
  updateMyAvailability: vi.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("MustChangePasswordModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("no renderiza nada cuando isOpen es false", () => {
    const { container } = renderWithClient(<MustChangePasswordModal isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza el formulario con título y campos requeridos cuando isOpen es true", () => {
    renderWithClient(<MustChangePasswordModal isOpen={true} />);
    expect(screen.getByText(/Cambio de contraseña requerido/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ingresa la contraseña temporal/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mínimo 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Repite tu nueva contraseña/i)).toBeInTheDocument();
  });

  it("llama a changePassword y ejecuta onSuccess al enviar datos válidos", async () => {
    const onSuccess = vi.fn();
    vi.mocked(authGateway.changePassword).mockResolvedValueOnce(undefined);

    renderWithClient(<MustChangePasswordModal isOpen={true} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Ingresa la contraseña temporal/i), {
      target: { value: "temp12345" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mínimo 8 caracteres/i), {
      target: { value: "nuevaClave123" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Repite tu nueva contraseña/i), {
      target: { value: "nuevaClave123" },
    });

    const submitBtn = screen.getByRole("button", { name: /Establecer nueva contraseña/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authGateway.changePassword).toHaveBeenCalledWith("temp12345", "nuevaClave123");
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
