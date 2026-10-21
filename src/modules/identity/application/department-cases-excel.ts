import * as XLSX from "xlsx";
import type { DepartmentHandlingMode } from "@/types/department";

export interface ParsedDepartmentCase {
  id?: string;
  rowNumber: number;
  label: string;
  handlingMode: DepartmentHandlingMode;
  description: string;
  workflowType?: string;
  warning?: string;
}

/**
 * Construye el libro de trabajo Excel con la estructura de plantilla.
 */
export function buildDepartmentCasesWorkbook(departmentName?: string): {
  wb: XLSX.WorkBook;
  filename: string;
} {
  const wb = XLSX.utils.book_new();

  const headers = [
    "N°",
    "Nombre del caso",
    "Tipo de atención",
    "¿Cómo lo dice el cliente?",
  ];

  const sampleRows = [
    [
      1,
      "Consultar saldo pendiente",
      "Asistido por IA",
      "- Cuánto debo\n- mi saldo\n- cuánto tengo pendiente\n- pásame el valor de la deuda\n- deuda actual\n- ¿cuál es mi saldo?\n- cuánto me falta por pagar",
    ],
    [
      2,
      "Fecha de vencimiento",
      "Asistido por IA",
      "- Cuándo debo pagar\n- hasta qué fecha tengo\n- vence hoy mi internet\n- fecha límite\n- ¿hasta cuándo puedo pagar?\n- cuándo vence mi factura",
    ],
    [
      3,
      "Reclamo o Inconformidad de Factura",
      "Directo a Humano",
      "- El cliente no está de acuerdo con el valor cobrado\n- pide revisión de su cobro\n- dice que no pagará hasta aclarar el saldo\n- reclama un cobro indebido",
    ],
    [
      4,
      "Reporte de Comprobante de Pago",
      "Asistido por IA",
      "- El cliente indica que ya realizó el pago\n- ya transfirió o envía la foto/archivo de un comprobante de depósito o transferencia bancaria",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Configuración de ancho de columnas para máxima legibilidad
  ws["!cols"] = [
    { wch: 6 },
    { wch: 36 },
    { wch: 22 },
    { wch: 70 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Casos y Motivos");

  const cleanName = departmentName
    ? `_${departmentName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
    : "";
  const filename = `plantilla_casos_departamento${cleanName}.xlsx`;

  return { wb, filename };
}

/**
 * Genera y descarga una plantilla Excel lista con las columnas y ejemplos
 * idénticos a la estructura requerida para entrenamiento y enrutamiento.
 */
export function downloadDepartmentCasesTemplate(departmentName?: string): void {
  const { wb, filename } = buildDepartmentCasesWorkbook(departmentName);
  XLSX.writeFile(wb, filename);
}

/**
 * Parsea un archivo Excel/CSV con casos y solicitudes departamentales.
 * Detecta inteligentemente columnas por nombres con o sin tildes o por posición.
 */
export async function parseDepartmentCasesExcel(
  fileOrBuffer: File | ArrayBuffer,
): Promise<{ cases: ParsedDepartmentCase[]; errors: string[] }> {
  let buffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    buffer = await fileOrBuffer.arrayBuffer();
  } else {
    buffer = fileOrBuffer;
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { cases: [], errors: ["El archivo no contiene ninguna hoja de cálculo."] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!rows || rows.length === 0) {
    return { cases: [], errors: ["El archivo está vacío o no contiene filas."] };
  }

  // Buscar fila de cabeceras en las primeras 5 filas
  let headerRowIndex = -1;
  let labelCol = -1;
  let modeCol = -1;
  let descCol = -1;

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || "").trim().toLowerCase();
      const norm = cell.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (
        labelCol === -1 &&
        (norm.includes("nombre") ||
          norm.includes("caso") ||
          norm.includes("motivo") ||
          norm.includes("asunto") ||
          norm.includes("titulo"))
      ) {
        labelCol = c;
      }
      if (
        modeCol === -1 &&
        (norm.includes("atencion") ||
          norm.includes("modalidad") ||
          norm.includes("modo") ||
          norm.includes("handling") ||
          norm.includes("tipo"))
      ) {
        modeCol = c;
      }
      if (
        descCol === -1 &&
        (norm.includes("dice") ||
          norm.includes("cliente") ||
          norm.includes("descripci") ||
          norm.includes("frase") ||
          norm.includes("ejemplo") ||
          norm.includes("utterance"))
      ) {
        descCol = c;
      }
    }

    if (labelCol !== -1) {
      headerRowIndex = r;
      break;
    }
  }

  // Fallback si no se encontró fila con nombres explícitos
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    labelCol = 1;
    modeCol = 2;
    descCol = 3;
  } else {
    // Si no se reconoció explícitamente alguna columna auxiliar, inferir posiciones contiguas
    if (modeCol === -1 && rows[headerRowIndex]?.length && rows[headerRowIndex].length > labelCol + 1) {
      modeCol = labelCol + 1;
    }
    if (descCol === -1 && rows[headerRowIndex]?.length && rows[headerRowIndex].length > (modeCol !== -1 ? modeCol : labelCol) + 1) {
      descCol = (modeCol !== -1 ? modeCol : labelCol) + 1;
    }
  }

  const parsedCases: ParsedDepartmentCase[] = [];
  const errors: string[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const rawLabel = String(row[labelCol] ?? "").trim();
    const rawMode = modeCol !== -1 ? String(row[modeCol] ?? "").trim() : "";
    const rawDesc = descCol !== -1 ? String(row[descCol] ?? "").trim() : "";

    // Ignorar filas completamente vacías o sin etiqueta de caso
    if (!rawLabel) {
      continue;
    }

    const rowNumber = r + 1;

    if (rawLabel.length < 2) {
      errors.push(`Fila ${rowNumber}: El nombre "${rawLabel}" es muy corto (mínimo 2 caracteres).`);
      continue;
    }

    // Normalizar handlingMode
    const modeLower = rawMode
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let handlingMode: DepartmentHandlingMode = "ai_assisted";
    if (
      modeLower.includes("humano") ||
      modeLower.includes("direct") ||
      modeLower.includes("agente") ||
      modeLower.includes("asesor") ||
      modeLower.includes("manual")
    ) {
      handlingMode = "human_direct";
    }

    // Normalizar descripción y aplicar salvaguarda para backend z.min(3)
    let description = rawDesc;
    let warning: string | undefined;

    if (!description || description.trim().length < 3) {
      description = `Consultas y solicitudes referentes a: ${rawLabel}`;
      warning = "Descripción completada automáticamente.";
    }

    parsedCases.push({
      rowNumber,
      label: rawLabel,
      handlingMode,
      description,
      workflowType: "GENERAL_INQUIRY",
      warning,
    });
  }

  if (parsedCases.length === 0 && errors.length === 0) {
    errors.push("No se encontraron casos válidos en el archivo Excel proporcionado.");
  }

  return { cases: parsedCases, errors };
}
