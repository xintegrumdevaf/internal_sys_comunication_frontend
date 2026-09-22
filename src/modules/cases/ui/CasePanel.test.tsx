import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CasePanel } from "./CasePanel";
import type { CaseDto } from "@/modules/cases/domain/case";

vi.mock("@/modules/cases/infrastructure/case.gateway", () => ({
  advanceCase: vi.fn(),
}));

const mockCase: CaseDto = {
  id: "case_123",
  conversationId: "conv_123",
  workflowType: "SUPPORT_INTERNET",
  status: "ACTIVE",
  departmentId: "dept_support",
  assignedAgentId: "agent_1",
  assignedAgentName: "Agente Uno",
  context: {
    workflowType: "SUPPORT_INTERNET",
    data: {
      client: { nationalId: "12345678", fullName: "Juan Pérez" },
      pendingContracts: [
        {
          id: "cont_1",
          label: "Casa Central",
          address: "Av. Principal 123",
          contractCode: "CON-001",
          sector: "Norte",
        },
        {
          id: "cont_2",
          label: "Oficina Playa",
          address: "Calle 45 #10",
          contractCode: "CON-002",
          sector: "Sur",
        },
      ],
    },
  },
  automation: { enabled: true, disabledReason: null },
  workflowInstance: {
    currentState: "WAITING_USER_DISAMBIGUATE",
  },
  createdAt: "2026-09-18T10:00:00Z",
  lastActivityAt: "2026-09-18T10:05:00Z",
  expiresAt: null,
};

describe("CasePanel - Desambiguación de Contratos", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra la tarjeta de contratos pendientes cuando el estado es WAITING_USER_DISAMBIGUATE", () => {
    render(
      <CasePanel
        caseDto={mockCase}
        busy={false}
        canWrite={true}
        departments={[]}
        onOpenSummary={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Selección de servicio pendiente \(2 contratos\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. Casa Central/i)).toBeInTheDocument();
    expect(screen.getByText(/Código: CON-001 \| Norte/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Oficina Playa/i)).toBeInTheDocument();
    expect(screen.getByText(/Código: CON-002 \| Sur/i)).toBeInTheDocument();
  });

  it("al pulsar 'Asignar', invoca onAdvance con la opción y el código de contrato", () => {
    const onAdvanceMock = vi.fn().mockResolvedValue(true);

    render(
      <CasePanel
        caseDto={mockCase}
        busy={false}
        canWrite={true}
        departments={[]}
        onOpenSummary={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
        onAdvance={onAdvanceMock}
      />,
    );

    const assignButtons = screen.getAllByRole("button", { name: /Asignar/i });
    expect(assignButtons).toHaveLength(2);

    fireEvent.click(assignButtons[0]);

    expect(onAdvanceMock).toHaveBeenCalledWith({
      selectedOption: 1,
      contractCode: "CON-001",
    });
  });

  it("no muestra el botón 'Asignar' si canWrite / canManage es false", () => {
    render(
      <CasePanel
        caseDto={mockCase}
        busy={false}
        canWrite={false}
        departments={[]}
        onOpenSummary={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
      />,
    );

    // Muestra la tarjeta informativa con los contratos
    expect(
      screen.getByText(/Selección de servicio pendiente \(2 contratos\)/i),
    ).toBeInTheDocument();
    // Pero ningún botón Asignar
    expect(screen.queryByRole("button", { name: /Asignar/i })).not.toBeInTheDocument();
  });

  it("no muestra la tarjeta si el estado no es WAITING_USER_DISAMBIGUATE", () => {
    const normalCase: CaseDto = {
      ...mockCase,
      workflowInstance: {
        currentState: "VALIDATE_CLIENT",
      },
    };

    render(
      <CasePanel
        caseDto={normalCase}
        busy={false}
        canWrite={true}
        departments={[]}
        onOpenSummary={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/Selección de servicio pendiente/i),
    ).not.toBeInTheDocument();
  });

  it("muestra el botón 'Ver detalles del caso' y llama a onOpenSummary al hacer clic", () => {
    const onOpenSummaryMock = vi.fn();

    render(
      <CasePanel
        caseDto={mockCase}
        busy={false}
        canWrite={true}
        departments={[]}
        onOpenSummary={onOpenSummaryMock}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
      />,
    );

    const detailsButton = screen.getByRole("button", {
      name: /Ver detalles del caso/i,
    });
    expect(detailsButton).toBeInTheDocument();

    fireEvent.click(detailsButton);
    expect(onOpenSummaryMock).toHaveBeenCalledTimes(1);
  });

  it("muestra 'No encontrada (null)' para Potencia óptica y MAC cuando vienen en null", () => {
    const diagnosticCase: CaseDto = {
      ...mockCase,
      context: {
        workflowType: "SUPPORT_INTERNET",
        data: {
          contract: {
            id: "cont_1",
            sector: "bellavista",
            oltName: "cData",
            pon: "2",
            serial: "48575443EAE381BB",
            router: "10.10.2.37",
          },
          technical: {
            brand: "v-sol",
            runState: "Offline",
            opticalPowerDbm: null,
            macAddress: null,
          },
        },
      },
    };

    render(
      <CasePanel
        caseDto={diagnosticCase}
        busy={false}
        canWrite={true}
        departments={[]}
        onOpenSummary={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
      />,
    );

    expect(screen.getByText(/Potencia óptica/i)).toBeInTheDocument();
    expect(screen.getByText(/MAC/i)).toBeInTheDocument();
    // Ambos deben mostrar "No encontrada (null)"
    const notFoundBadges = screen.getAllByText("No encontrada (null)");
    expect(notFoundBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("permite continuar el diagnóstico al ingresar respuesta y hacer clic en 'Continuar Diagnóstico'", () => {
    const onAdvanceMock = vi.fn().mockResolvedValue(true);
    const waitingDiagCase: CaseDto = {
      ...mockCase,
      workflowInstance: {
        currentState: "WAITING_USER_DIAGNOSTIC",
      },
      context: {
        workflowType: "SUPPORT_INTERNET",
        data: {
          diagnostic: {
            status: "CRITICAL",
            instruction: "Verifique si las luces del router están encendidas",
          },
        },
      },
    };

    render(
      <CasePanel
        caseDto={waitingDiagCase}
        busy={false}
        canWrite={true}
        departments={[]}
        onOpenSummary={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onTransfer={vi.fn()}
        onDisableAutomation={vi.fn()}
        onReactivateAutomation={vi.fn()}
        onAdvance={onAdvanceMock}
      />,
    );

    expect(
      screen.getByText(/Continuación de Diagnóstico Técnico/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Verifique si las luces del router están encendidas/i).length,
    ).toBeGreaterThanOrEqual(1);

    const input = screen.getByPlaceholderText(/Respuesta cliente/i);
    fireEvent.change(input, { target: { value: "Luz roja LOS encendida" } });

    const continueBtn = screen.getByRole("button", { name: /Continuar Diagnóstico/i });
    fireEvent.click(continueBtn);

    expect(onAdvanceMock).toHaveBeenCalledWith({
      answer: "Luz roja LOS encendida",
    });
  });
});

