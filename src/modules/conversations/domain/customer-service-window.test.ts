import { describe, expect, it } from "vitest";
import { isCustomerServiceWindowClosed } from "./customer-service-window";

const NOW = Date.parse("2026-11-02T16:10:00.000Z");
const MIN = 60 * 1000;

function message(partial: {
  author: string;
  createdAt: string;
  direction?: string;
  status?: string;
  errorMessage?: string | null;
}) {
  return partial;
}

describe("isCustomerServiceWindowClosed", () => {
  it("está abierta si el cliente escribió hace menos de 24 h, aunque haya un fallo viejo", () => {
    const closed = isCustomerServiceWindowClosed(
      [
        message({
          author: "agent",
          direction: "outbound",
          status: "failed",
          errorMessage: "131047 Re-engagement message",
          createdAt: new Date(NOW - 30 * 60 * MIN).toISOString(),
        }),
        message({
          author: "customer",
          direction: "inbound",
          createdAt: new Date(NOW - 20 * MIN).toISOString(),
        }),
        message({
          author: "agent",
          direction: "outbound",
          status: "sent",
          createdAt: new Date(NOW - 2 * MIN).toISOString(),
        }),
      ],
      NOW,
    );
    expect(closed).toBe(false);
  });

  it("está cerrada si el último mensaje del cliente tiene 24 h o más", () => {
    const closed = isCustomerServiceWindowClosed(
      [
        message({
          author: "customer",
          direction: "inbound",
          createdAt: new Date(NOW - 25 * 60 * MIN).toISOString(),
        }),
      ],
      NOW,
    );
    expect(closed).toBe(true);
  });

  it("está cerrada si WhatsApp rechazó un envío después del último mensaje del cliente", () => {
    const closed = isCustomerServiceWindowClosed(
      [
        message({
          author: "customer",
          direction: "inbound",
          createdAt: new Date(NOW - 30 * MIN).toISOString(),
        }),
        message({
          author: "agent",
          direction: "outbound",
          status: "failed",
          errorMessage: JSON.stringify({ code: 131047 }),
          createdAt: new Date(NOW - 5 * MIN).toISOString(),
        }),
      ],
      NOW,
    );
    expect(closed).toBe(true);
  });

  it("está cerrada si todavía no hay ningún mensaje del cliente", () => {
    expect(
      isCustomerServiceWindowClosed(
        [
          message({
            author: "agent",
            direction: "outbound",
            createdAt: new Date(NOW).toISOString(),
          }),
        ],
        NOW,
      ),
    ).toBe(true);
  });
});
