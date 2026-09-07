import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DepartmentsDirectoryPanel } from "./DepartmentsDirectoryPanel";
import * as useSessionModule from "@/modules/identity/application/use-session";
import * as useDepartmentsAdminModule from "@/modules/identity/application/use-departments-admin";

vi.mock("@/modules/identity/application/use-session", () => ({
  useDepartmentsQuery: vi.fn(),
}));

vi.mock("@/modules/identity/application/use-departments-admin", () => ({
  useDepartmentsAdmin: vi.fn(),
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

describe("DepartmentsDirectoryPanel", () => {
  const mockCreateDepartment = vi.fn().mockResolvedValue(true);
  const mockUpdateDepartment = vi.fn().mockResolvedValue(true);
  const mockDeactivateDepartment = vi.fn().mockResolvedValue(true);
  const mockReactivateDepartment = vi.fn().mockResolvedValue(true);
  const mockGetDepartmentCases = vi.fn().mockResolvedValue([]);

  beforeEach(() => {
    vi.mocked(useDepartmentsAdminModule.useDepartmentsAdmin).mockReturnValue({
      busy: false,
      createDepartment: mockCreateDepartment,
      updateDepartment: mockUpdateDepartment,
      deactivateDepartment: mockDeactivateDepartment,
      reactivateDepartment: mockReactivateDepartment,
      getDepartmentCases: mockGetDepartmentCases,
      addDepartmentCase: vi.fn(),
      deleteDepartmentCase: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renderiza departamentos con contador de casos atendidos", () => {
    vi.mocked(useSessionModule.useDepartmentsQuery).mockReturnValue({
      data: [
        {
          id: "dept-1",
          name: "Soporte Técnico",
          slug: "soporte",
          description: "Área de incidencias y fibra",
          visibility: "shared",
          active: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          cases: [
            {
              id: "c-1",
              label: "Lentitud de Internet",
              description: "cuando navega lento",
              handlingMode: "ai_assisted",
            },
            {
              id: "c-2",
              label: "Corte de Fibra",
              description: "cuando no tiene enlace",
              handlingMode: "human_direct",
            },
          ],
        },
      ],
    } as unknown as ReturnType<typeof useSessionModule.useDepartmentsQuery>);

    renderWithClient(<DepartmentsDirectoryPanel />);

    expect(screen.getByText("Soporte Técnico")).toBeInTheDocument();
    expect(screen.getByText("Área de incidencias y fibra")).toBeInTheDocument();
    expect(screen.getByText("2 casos")).toBeInTheDocument();
  });

  it("permite expandir un departamento para ver sus casos atendidos", async () => {
    vi.mocked(useSessionModule.useDepartmentsQuery).mockReturnValue({
      data: [
        {
          id: "dept-1",
          name: "Soporte Técnico",
          slug: "soporte",
          visibility: "shared",
          active: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          cases: [
            {
              id: "c-1",
              label: "Lentitud de Internet",
              description: "cuando navega lento",
              handlingMode: "ai_assisted",
            },
          ],
        },
      ],
    } as unknown as ReturnType<typeof useSessionModule.useDepartmentsQuery>);

    renderWithClient(<DepartmentsDirectoryPanel />);

    const expandBtn = screen.getByTitle(/Ver casos atendidos/i);
    fireEvent.click(expandBtn);

    expect(screen.getByText("Motivos y Casos que Resuelve (1)")).toBeInTheDocument();
    expect(screen.getByText("Lentitud de Internet")).toBeInTheDocument();
    expect(screen.getByText("cuando navega lento")).toBeInTheDocument();
  });

  it("permite abrir el formulario, agregar descripción y motivos/casos y enviar", async () => {
    vi.mocked(useSessionModule.useDepartmentsQuery).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useSessionModule.useDepartmentsQuery>);

    renderWithClient(<DepartmentsDirectoryPanel />);

    const newBtn = screen.getByRole("button", { name: /Nuevo departamento/i });
    fireEvent.click(newBtn);

    expect(
      screen.getByRole("heading", { name: /Nuevo departamento/i }),
    ).toBeInTheDocument();


    fireEvent.change(screen.getByPlaceholderText(/Ej: Soporte Técnico/i), {
      target: { value: "Retenciones" },
    });
    fireEvent.change(screen.getByPlaceholderText(/soporte-tecnico/i), {
      target: { value: "retenciones" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Ej: Área técnica encargada de atender caídas/i),
      {
        target: { value: "Área para evitar cancelaciones" },
      },
    );

    // Agregar un caso
    const addCaseBtn = screen.getByRole("button", { name: /Agregar Motivo\/Caso/i });
    fireEvent.click(addCaseBtn);

    fireEvent.change(screen.getByPlaceholderText(/Ej: Cancelación de Contrato/i), {
      target: { value: "Baja de Servicio" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Ej: cuando el cliente pide darse de baja/i),
      {
        target: { value: "cuando el cliente quiere cancelar" },
      },
    );

    // Cambiar a Directo a Humano
    const humanBtn = screen.getByRole("button", { name: /Directo a Humano/i });
    fireEvent.click(humanBtn);

    const submitBtn = screen.getByRole("button", { name: /Crear departamento/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateDepartment).toHaveBeenCalledWith({
        name: "Retenciones",
        slug: "retenciones",
        description: "Área para evitar cancelaciones",
        visibility: "shared",
        cases: [
          {
            id: undefined,
            label: "Baja de Servicio",
            description: "cuando el cliente quiere cancelar",
            handlingMode: "human_direct",
            workflowType: "GENERAL_INQUIRY",
            active: true,
          },
        ],
      });
    });
  });
});
