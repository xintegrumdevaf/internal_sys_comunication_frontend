const WINDOW_MS = 24 * 60 * 60 * 1000;

export type SessionWindowMessage = {
  author: string;
  direction?: string | null;
  status?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

/** Error 131047 de Meta: la ventana de atención de 24 h ya estaba cerrada. */
export function isWhatsAppSessionWindowError(errorMessage?: string | null): boolean {
  if (!errorMessage) return false;
  let raw = errorMessage;
  try {
    const parsed = JSON.parse(errorMessage) as {
      code?: unknown;
      explanation?: unknown;
      details?: unknown;
      message?: unknown;
      title?: unknown;
    };
    if (typeof parsed === "object" && parsed !== null) {
      const text = parsed.explanation || parsed.details || parsed.message || parsed.title;
      if (typeof text === "string" && text.trim()) raw = text;
      if (parsed.code === 131047 || String(parsed.code) === "131047") return true;
    }
  } catch {
    // El backend a veces guarda el error como texto plano.
  }

  const lower = raw.toLowerCase();
  return (
    lower.includes("131047") ||
    lower.includes("24 horas") ||
    lower.includes("24-hour") ||
    lower.includes("24h") ||
    lower.includes("re-engagement") ||
    lower.includes("customer service window") ||
    (lower.includes("template") &&
      (lower.includes("24") ||
        lower.includes("window") ||
        lower.includes("expire") ||
        lower.includes("reopen") ||
        lower.includes("re-engage"))) ||
    (lower.includes("plantilla") &&
      (lower.includes("24") ||
        lower.includes("ventana") ||
        lower.includes("expir") ||
        lower.includes("reabrir")))
  );
}

function timeOf(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function isInbound(message: SessionWindowMessage): boolean {
  return message.author === "customer" || message.direction === "inbound";
}

/**
 * La ventana está cerrada si el cliente no escribió en las últimas 24 h,
 * o si un envío posterior a ese mensaje fue rechazado por esa razón.
 * Un fallo anterior no la mantiene cerrada cuando el cliente vuelve a escribir.
 */
export function isCustomerServiceWindowClosed(
  messages: SessionWindowMessage[],
  now = Date.now(),
): boolean {
  let lastInboundAt = Number.NEGATIVE_INFINITY;
  for (const message of messages) {
    if (!isInbound(message)) continue;
    const at = timeOf(message.createdAt);
    if (at > lastInboundAt) lastInboundAt = at;
  }
  if (lastInboundAt === Number.NEGATIVE_INFINITY) return true;

  const rejectedAfterReply = messages.some((message) => {
    if (message.status !== "failed" || !isWhatsAppSessionWindowError(message.errorMessage)) {
      return false;
    }
    return timeOf(message.createdAt) > lastInboundAt;
  });
  if (rejectedAfterReply) return true;

  return now - lastInboundAt >= WINDOW_MS;
}
