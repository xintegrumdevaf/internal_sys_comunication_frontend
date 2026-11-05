/**
 * Utilidades de formato de fecha/hora puras, sin dependencia de ningun modulo
 * de negocio (usadas por conversations, cases, escalations, audit, realtime...).
 */

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(diff / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function messageClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "Hoy" / "Ayer" / fecha corta — para separadores de día estilo WhatsApp en el hilo de mensajes. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoy";
  if (sameDay(date, yesterday)) return "Ayer";
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Formato de fecha/hora para la lista de conversaciones idéntico a WhatsApp Web:
 * - Hoy: hora exacta en formato 12h (ej: "3:30 p.m.")
 * - Ayer: "Ayer"
 * - Esta semana (últimos 6 días): nombre del día ("Lunes", "Martes", etc.)
 * - Más antiguo: fecha corta numérica ("dd/mm/aaaa")
 */
export function formatConversationTimestamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // 1. Mismo día -> hora exacta estilo WhatsApp "3:30 p.m."
  if (sameDay(date, now)) {
    return date
      .toLocaleTimeString("es-EC", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/p\.\s*m\./i, "p.m.")
      .replace(/a\.\s*m\./i, "a.m.");
  }

  // 2. Ayer -> "Ayer"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) {
    return "Ayer";
  }

  // 3. Esta semana (dentro de los últimos 6 días) -> Nombre del día ("Lunes", etc.)
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays < 7) {
    const weekday = date.toLocaleDateString("es-EC", { weekday: "long" });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }

  // 4. Anterior -> Fecha formato corto dd/mm/aaaa
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
