import { describe, expect, it } from "vitest";
import {
  extractTemplateVariables,
  substituteTemplateVariables,
  templateCategoryLabel,
  templateStatusMeta,
  validateMetaTemplateName,
  validateTemplateBody,
} from "./message-template";

describe("message-template domain", () => {
  describe("validateMetaTemplateName", () => {
    it("acepta nombres válidos con letras minúsculas, números y guiones bajos", () => {
      expect(validateMetaTemplateName("pedido_confirmado_123").valid).toBe(true);
      expect(validateMetaTemplateName("corte_servicio").valid).toBe(true);
      expect(validateMetaTemplateName("validacion_pago_cuenca").valid).toBe(true);
    });

    it("rechaza nombres vacíos", () => {
      const res = validateMetaTemplateName("");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("El nombre de la plantilla es obligatorio.");
    });

    it("rechaza mayúsculas, espacios y caracteres especiales", () => {
      expect(validateMetaTemplateName("Pedido_Confirmado").valid).toBe(false);
      expect(validateMetaTemplateName("pedido confirmado").valid).toBe(false);
      expect(validateMetaTemplateName("pedido-confirmado").valid).toBe(false);
      expect(validateMetaTemplateName("pedido!").valid).toBe(false);
    });
  });

  describe("validateTemplateBody", () => {
    it("acepta cuerpos válidos menores de 1024 caracteres", () => {
      expect(validateTemplateBody("Hola {{1}}, tu pedido está listo.").valid).toBe(true);
    });

    it("rechaza cuerpo vacío", () => {
      expect(validateTemplateBody("").valid).toBe(false);
    });

    it("rechaza cuerpo de más de 1024 caracteres", () => {
      const longBody = "a".repeat(1025);
      const res = validateTemplateBody(longBody);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("El cuerpo del mensaje no puede exceder 1024 caracteres.");
    });
  });

  describe("extractTemplateVariables", () => {
    it("extrae variables únicas y ordenadas de un texto", () => {
      const text = "Hola {{1}}, su factura {{3}} expira el {{2}}. Saludos {{1}}.";
      const vars = extractTemplateVariables(text);
      expect(vars).toEqual(["1", "2", "3"]);
    });

    it("devuelve arreglo vacío si no hay variables", () => {
      expect(extractTemplateVariables("Mensaje sin variables")).toEqual([]);
    });
  });

  describe("substituteTemplateVariables", () => {
    it("sustituye variables por sus valores o marcador por defecto", () => {
      const text = "Hola {{1}}, tu saldo es {{2}}.";
      const filled = substituteTemplateVariables(text, { "1": "Carlos" });
      expect(filled).toBe("Hola Carlos, tu saldo es [Variable 2].");
    });
  });

  describe("templateCategoryLabel y templateStatusMeta", () => {
    it("retorna etiquetas y clases para categorías y estados", () => {
      expect(templateCategoryLabel("MARKETING")).toBe("Marketing");
      expect(templateCategoryLabel("UTILITY")).toBe("Utilidad");
      expect(templateCategoryLabel("AUTHENTICATION")).toBe("Autenticación");

      expect(templateStatusMeta("APPROVED").label).toBe("Aprobado");
      expect(templateStatusMeta("PENDING").label).toBe("Pendiente");
      expect(templateStatusMeta("REJECTED").label).toBe("Rechazado");
    });
  });
});
