import { describe, expect, it } from "vitest";
import {
  validateCampaignName,
  validateCampaignMessage,
  parseCsvText,
  buildCampaignRecipientsFromRows,
  formatRoutingBehaviorSummary,
  campaignStatusMeta,
} from "./campaign";

describe("Campaign Domain", () => {
  describe("validateCampaignName", () => {
    it("fails when empty", () => {
      expect(validateCampaignName("").valid).toBe(false);
      expect(validateCampaignName("   ").valid).toBe(false);
    });

    it("fails when over 50 chars", () => {
      const longName = "a".repeat(51);
      expect(validateCampaignName(longName).valid).toBe(false);
    });

    it("passes when valid", () => {
      expect(validateCampaignName("Campaña Promocional Septiembre").valid).toBe(true);
    });
  });

  describe("validateCampaignMessage", () => {
    it("fails when empty", () => {
      expect(validateCampaignMessage("").valid).toBe(false);
    });

    it("passes when non-empty", () => {
      expect(validateCampaignMessage("Hola {{name}}, recordatorio de pago.").valid).toBe(true);
    });
  });

  describe("parseCsvText & buildCampaignRecipientsFromRows", () => {
    it("parses CSV correctly and extracts recipients", () => {
      const csv =
        "number,name,custom_city\n+573001234567,Carlos,Bogotá\n+573009876543,Ana,Medellén\ninvalid,Short,Cali";
      const { rows } = parseCsvText(csv);
      expect(rows.length).toBe(3);

      const { validRecipients, invalidCount } = buildCampaignRecipientsFromRows(rows);
      expect(validRecipients.length).toBe(2);
      expect(invalidCount).toBe(1);
      expect(validRecipients[0].number).toBe("+573001234567");
      expect(validRecipients[0].name).toBe("Carlos");
      expect(validRecipients[0].variables?.custom_city).toBe("Bogotá");
    });
  });

  describe("formatRoutingBehaviorSummary", () => {
    it("returns default when missing", () => {
      expect(formatRoutingBehaviorSummary(undefined)).toBe("Cerrado · Sin departamento");
    });

    it("formats summary with dept and bot", () => {
      const summary = formatRoutingBehaviorSummary({
        chatStatus: "open",
        departmentName: "Ventas",
        assignedUserName: "Juan",
        keepAssigned: true,
        delegateToBot: true,
        forceChatUpdate: false,
      });
      expect(summary).toBe("Abierto · Ventas · Asignado: Juan · Delegado a bot");
    });
  });

  describe("campaignStatusMeta", () => {
    it("returns correct badge classes for status", () => {
      expect(campaignStatusMeta("FINISHED").label).toBe("Terminado");
      expect(campaignStatusMeta("SUSPENDED").label).toBe("Suspendido");
      expect(campaignStatusMeta("IN_PROGRESS").label).toBe("En curso");
      expect(campaignStatusMeta("DRAFT").label).toBe("Borrador");
    });
  });
});
