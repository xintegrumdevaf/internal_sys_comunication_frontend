import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildDepartmentCasesWorkbook, parseDepartmentCasesExcel } from "./department-cases-excel";

describe("department-cases-excel", () => {
  describe("buildDepartmentCasesWorkbook", () => {
    it("genera el libro de trabajo Excel con las cabeceras y ejemplos correctos", () => {
      const { wb, filename } = buildDepartmentCasesWorkbook("Cobranzas");

      expect(filename).toBe("plantilla_casos_departamento_cobranzas.xlsx");
      expect(wb.SheetNames).toContain("Casos y Motivos");

      const sheet = wb.Sheets["Casos y Motivos"];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      expect(rows[0]).toEqual([
        "N°",
        "Nombre del caso",
        "Tipo de atención",
        "¿Cómo lo dice el cliente?",
      ]);
      expect(rows.length).toBeGreaterThan(3);
    });
  });

  describe("parseDepartmentCasesExcel", () => {
    it("parsea correctamente un archivo con el formato exacto del usuario", async () => {
      const data = [
        ["N°", "Nombre del caso", "Tipo de atención", "¿Cómo lo dice el cliente?"],
        [
          1,
          "Consultar saldo pendiente",
          "Asistido por IA",
          "- Cuánto debo\n- mi saldo\n- cuánto tengo pendiente",
        ],
        [
          2,
          "Fecha de vencimiento",
          "Asistido por IA",
          "- Cuándo debo pagar\n- hasta qué fecha tengo",
        ],
        [3, "Reclamo de Factura", "Directo a Humano", "- Cobro indebido\n- No estoy de acuerdo"],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

      const result = await parseDepartmentCasesExcel(buffer);

      expect(result.errors).toEqual([]);
      expect(result.cases).toHaveLength(3);

      expect(result.cases[0]).toMatchObject({
        rowNumber: 2,
        label: "Consultar saldo pendiente",
        handlingMode: "ai_assisted",
        description: "- Cuánto debo\n- mi saldo\n- cuánto tengo pendiente",
      });

      expect(result.cases[1]).toMatchObject({
        rowNumber: 3,
        label: "Fecha de vencimiento",
        handlingMode: "ai_assisted",
      });

      expect(result.cases[2]).toMatchObject({
        rowNumber: 4,
        label: "Reclamo de Factura",
        handlingMode: "human_direct",
        description: "- Cobro indebido\n- No estoy de acuerdo",
      });
    });

    it("maneja columnas con nombres en minúsculas, sin tildes o con variaciones", async () => {
      const data = [
        ["id", "caso", "modo atencion", "que dice el cliente"],
        ["1", "Reconexión", "agente humano", "solicito reconexión urgente"],
        ["2", "Cambio de Plan", "bot con ia", "deseo cambiar mi paquete"],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

      const result = await parseDepartmentCasesExcel(buffer);

      expect(result.errors).toEqual([]);
      expect(result.cases).toHaveLength(2);
      expect(result.cases[0].handlingMode).toBe("human_direct");
      expect(result.cases[1].handlingMode).toBe("ai_assisted");
    });

    it("autocompleta descripción si viene vacía para cumplir validaciones del backend", async () => {
      const data = [
        ["N°", "Nombre del caso", "Tipo de atención", "¿Cómo lo dice el cliente?"],
        [1, "Soporte IPTV", "IA", ""],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

      const result = await parseDepartmentCasesExcel(buffer);

      expect(result.cases).toHaveLength(1);
      expect(result.cases[0].description).toContain("Soporte IPTV");
      expect(result.cases[0].warning).toBeDefined();
    });

    it("salta filas con nombres vacíos y reporta error si no hay casos", async () => {
      const data = [
        ["N°", "Nombre del caso", "Tipo de atención", "¿Cómo lo dice el cliente?"],
        ["", "", "", ""],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

      const result = await parseDepartmentCasesExcel(buffer);

      expect(result.cases).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
