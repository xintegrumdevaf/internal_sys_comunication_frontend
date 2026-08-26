import { describe, expect, it } from "vitest";
import {
  buildCampaignRecipients,
  estimateCampaignCost,
  normalizePhoneNumber,
  parseCsvText,
} from "./campaign";

describe("WhatsApp Campaign Domain", () => {
  describe("parseCsvText", () => {
    it("debe parsear un CSV separado por comas", () => {
      const csv = `telefono,nombre,monto\n+573001234567,Juan,$50.000\n+573009876543,Maria,$120.000`;
      const { headers, rows } = parseCsvText(csv);
      expect(headers).toEqual(["telefono", "nombre", "monto"]);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        telefono: "+573001234567",
        nombre: "Juan",
        monto: "$50.000",
      });
    });

    it("debe parsear un CSV separado por punto y coma", () => {
      const csv = `telefono;nombre;monto\n+573001234567;Pedro;$80.000`;
      const { headers, rows } = parseCsvText(csv);
      expect(headers).toEqual(["telefono", "nombre", "monto"]);
      expect(rows[0].nombre).toBe("Pedro");
    });
  });

  describe("normalizePhoneNumber", () => {
    it("debe limpiar espacios y caracteres no numéricos excepto el signo +", () => {
      expect(normalizePhoneNumber("+57 300 123-4567")).toBe("+573001234567");
      expect(normalizePhoneNumber("300 (123) 4567")).toBe("3001234567");
    });
  });

  describe("buildCampaignRecipients", () => {
    it("debe mapear correctamente las columnas CSV a las variables de plantilla", () => {
      const rows = [
        { telefono: "+573001234567", cliente: "Carlos", deuda: "45,000" },
        { telefono: "+573009876543", cliente: "Lucía", deuda: "90,000" },
      ];
      const mapping = { "1": "cliente", "2": "deuda" };

      const { recipients, invalidRows } = buildCampaignRecipients(rows, "telefono", mapping);
      expect(invalidRows).toBe(0);
      expect(recipients).toHaveLength(2);
      expect(recipients[0]).toEqual({
        phone: "+573001234567",
        variables: { "1": "Carlos", "2": "45,000" },
        status: "pending",
      });
    });

    it("debe omitir filas sin número de teléfono", () => {
      const rows = [
        { telefono: "", cliente: "Sin Telefono", deuda: "10,000" },
        { telefono: "+573001112233", cliente: "Válido", deuda: "20,000" },
      ];
      const { recipients, invalidRows } = buildCampaignRecipients(rows, "telefono", {
        "1": "cliente",
      });
      expect(invalidRows).toBe(1);
      expect(recipients).toHaveLength(1);
    });
  });

  describe("estimateCampaignCost", () => {
    it("debe calcular el costo estimado correctamente", () => {
      expect(estimateCampaignCost(100, 0.05)).toBe(5.0);
      expect(estimateCampaignCost(2500, 0.05)).toBe(125.0);
    });
  });
});
