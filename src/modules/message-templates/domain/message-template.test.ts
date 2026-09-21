import { describe, expect, it } from "vitest";
import {
  extractTemplateVariables,
  substituteTemplateVariables,
  templateCategoryLabel,
  templateStatusMeta,
  validateAllTemplatePolicies,
  validateMetaTemplateName,
  validateProhibitedLinks,
  validateTemplateBody,
  validateTemplateVariables,
} from "./message-template";

describe("message-template domain", () => {
  describe("validateMetaTemplateName", () => {
    it("acepta nombres válidos con letras minúsculas, números y guiones bajos iniciando con letra minúscula", () => {
      expect(validateMetaTemplateName("pedido_confirmado_123").valid).toBe(true);
      expect(validateMetaTemplateName("corte_servicio").valid).toBe(true);
      expect(validateMetaTemplateName("validacion_pago_cuenca").valid).toBe(true);
    });

    it("rechaza nombres que inician con un número", () => {
      const res = validateMetaTemplateName("123_pedido");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("debe empezar con una letra minúscula");
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

  describe("validateTemplateVariables", () => {
    it("acepta variables bien formadas con texto previo y posterior", () => {
      expect(
        validateTemplateVariables("Estimado cliente {{1}}, su saldo es {{2}} USD.").valid,
      ).toBe(true);
    });

    it("rechaza variables contiguas como {{1}}{{2}}", () => {
      const res = validateTemplateVariables("Estimado cliente {{1}}{{2}} su saldo vence.");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("variables contiguas");
    });

    it("rechaza variables no secuenciales que se saltan números (ej. falta {{2}})", () => {
      const res = validateTemplateVariables("Hola {{1}}, su código {{3}} está activo.");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Falta la variable {{2}}");
    });

    it("rechaza plantillas que inician directamente con una variable", () => {
      const res = validateTemplateVariables("{{1}} es su código de verificación.");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("no puede iniciar directamente con una variable");
    });

    it("rechaza plantillas que finalizan directamente con una variable", () => {
      const res = validateTemplateVariables("Su código de verificación es {{1}}");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("no puede finalizar directamente con una variable");
    });
  });

  describe("validateProhibitedLinks", () => {
    it("detecta acortadores de URL prohibidos por Meta (bit.ly, tinyurl, etc.)", () => {
      expect(validateProhibitedLinks("Ingresa en bit.ly/mi-link").valid).toBe(false);
      expect(validateProhibitedLinks("Verifica en https://tinyurl.com/abc").valid).toBe(false);
      expect(validateProhibitedLinks("Visita https://nuestrodominio.com/pago").valid).toBe(true);
    });
  });

  describe("validateTemplateBody", () => {
    it("acepta cuerpos válidos menores de 1024 caracteres y con variables correctas", () => {
      expect(
        validateTemplateBody("Hola {{1}}, tu pedido {{2}} está listo para entrega.").valid,
      ).toBe(true);
    });

    it("rechaza cuerpo vacío", () => {
      expect(validateTemplateBody("").valid).toBe(false);
    });

    it("rechaza cuerpo de más de 1024 caracteres", () => {
      const longBody = "a".repeat(1025);
      const res = validateTemplateBody(longBody);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("El cuerpo del mensaje no puede superar los 1024 caracteres.");
    });
  });

  describe("validateAllTemplatePolicies", () => {
    it("retorna errores acumulados para un payload con múltiples fallos", () => {
      const res = validateAllTemplatePolicies({
        name: "123_invalid",
        body: "{{1}}{{2}} acortador bit.ly/test",
        headerType: "TEXT",
        headerText: "a".repeat(70),
        footerText: "b".repeat(70),
      });

      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(1);
    });

    it("retorna valid = true para un payload completamente válido", () => {
      const res = validateAllTemplatePolicies({
        name: "notificacion_pago",
        body: "Estimado cliente {{1}}, su pago de {{2}} fue procesado.",
        headerType: "TEXT",
        headerText: "Aviso importante",
        footerText: "Gracias por su preferencia",
      });

      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
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
