import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import * as XLSX from "xlsx";
import { DepartmentCasesBulkImportModal } from "./DepartmentCasesBulkImportModal";

describe("DepartmentCasesBulkImportModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function createMockExcelFile(rows: (string | number)[][], fileName = "casos.xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    return new File([buffer], fileName, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  it("no renderiza nada si open es false", () => {
    const { container } = render(
      <DepartmentCasesBulkImportModal open={false} onClose={vi.fn()} onImport={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza la cabecera, nombre del departamento y botón de descargar plantilla", () => {
    render(
      <DepartmentCasesBulkImportModal
        open={true}
        departmentName="Cobranzas"
        departmentSlug="cobranzas"
        existingCasesCount={2}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(screen.getByText(/Carga Masiva de Motivos y Casos/i)).toBeInTheDocument();
    expect(screen.getByText("Cobranzas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Descargar Plantilla Excel/i })).toBeInTheDocument();
  });

  it("carga un archivo Excel, parsea las filas y permite alternar modo IA / Humano y excluir filas", async () => {
    const file = createMockExcelFile([
      ["N°", "Nombre del caso", "Tipo de atención", "¿Cómo lo dice el cliente?"],
      [1, "Consultar saldo pendiente", "Asistido por IA", "- Cuánto debo\n- mi saldo"],
      [2, "Reclamo de Factura", "Directo a Humano", "- Cobro indebido"],
    ]);

    const mockImport = vi.fn().mockResolvedValue(true);
    const mockClose = vi.fn();

    render(
      <DepartmentCasesBulkImportModal
        open={true}
        departmentName="Cobranzas"
        existingCasesCount={3}
        onClose={mockClose}
        onImport={mockImport}
      />,
    );

    // Subir archivo mediante el input file oculto
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [file] } });

    // Esperar a que se parseen los casos
    await waitFor(() => {
      expect(screen.getByText("Consultar saldo pendiente")).toBeInTheDocument();
    });

    expect(screen.getByText("Reclamo de Factura")).toBeInTheDocument();
    expect(screen.getByText("2 detectados")).toBeInTheDocument();
    expect(screen.getByText(/1 con IA/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Directo a Humano/i)).toBeInTheDocument();

    // Alternar tipo de atención del primer caso (IA -> Humano)
    const toggleButtons = screen.getAllByTitle(/Haz clic para alternar tipo de atención/i);
    fireEvent.click(toggleButtons[0]);

    // Ahora ambos son directos a humano
    expect(screen.getByText(/2 Directo a Humano/i)).toBeInTheDocument();

    // Eliminar la segunda fila
    const removeButtons = screen.getAllByTitle(/Excluir este caso de la importación/i);
    fireEvent.click(removeButtons[1]);

    expect(screen.queryByText("Reclamo de Factura")).not.toBeInTheDocument();
    expect(screen.getByText("1 detectados")).toBeInTheDocument();

    // Cambiar estrategia a reemplazar
    const replaceRadio = screen.getByLabelText(/Reemplazar casos actuales/i);
    fireEvent.click(replaceRadio);

    // Confirmar importación
    const submitBtn = screen.getByRole("button", { name: /Importar 1 Caso/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockImport).toHaveBeenCalledTimes(1);
    });

    expect(mockImport).toHaveBeenCalledWith(
      [
        {
          label: "Consultar saldo pendiente",
          description: "- Cuánto debo\n- mi saldo",
          handlingMode: "human_direct",
          workflowType: "GENERAL_INQUIRY",
          active: true,
        },
      ],
      "replace",
    );

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
