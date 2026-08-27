import { describe, expect, it } from "vitest";
import {
  extractTemplateVariables,
  substituteVariables,
  validateMetaTemplateName,
} from "./template";

describe("WhatsApp Template Domain", () => {
  describe("validateMetaTemplateName", () => {
    it("debe validar nombres válidos de Meta", () => {
      expect(validateMetaTemplateName("recordatorio_pago_v1").valid).toBe(true);
      expect(validateMetaTemplateName("corte_programado_2026").valid).toBe(true);
      expect(validateMetaTemplateName("bienvenida").valid).toBe(true);
    });

    it("debe rechazar nombres con mayúsculas, espacios o caracteres especiales", () => {
      expect(validateMetaTemplateName("Recordatorio_Pago").valid).toBe(false);
      expect(validateMetaTemplateName("recordatorio pago").valid).toBe(false);
      expect(validateMetaTemplateName("corte-programado").valid).toBe(false);
      expect(validateMetaTemplateName("pago!").valid).toBe(false);
    });

    it("debe rechazar nombres vacíos", () => {
      expect(validateMetaTemplateName("").valid).toBe(false);
      expect(validateMetaTemplateName("   ").valid).toBe(false);
    });
  });

  describe("extractTemplateVariables", () => {
    it("debe extraer variables en orden numérico", () => {
      const body = "Hola {{1}}, tu factura de {{2}} vence el {{3}}. Código: {{1}}";
      expect(extractTemplateVariables(body)).toEqual(["1", "2", "3"]);
    });

    it("debe retornar arreglo vacío si no hay variables", () => {
      expect(extractTemplateVariables("Mensaje sin variables")).toEqual([]);
    });
  });

  describe("substituteVariables", () => {
    it("debe reemplazar correctamente las variables {{1}}, {{2}}", () => {
      const body = "Hola {{1}}, tu saldo es {{2}}.";
      const res = substituteVariables(body, { "1": "Carlos", "2": "$50,000" });
      expect(res).toBe("Hola Carlos, tu saldo es $50,000.");
    });

    it("debe colocar fallback cuando falta un valor", () => {
      const body = "Hola {{1}}, tu saldo es {{2}}.";
      const res = substituteVariables(body, { "1": "Carlos" });
      expect(res).toBe("Hola Carlos, tu saldo es [{{2}}].");
    });
  });
});
