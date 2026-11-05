import type { CaseStatus } from "@/modules/cases/domain/case";

/** Entidades Conversation/Message reales del backend (03_API_CONTRACT.md §C.4). */

export type ConversationStatus = "open" | "pending" | "resolved" | "closed";
export type MessageAuthor = "customer" | "ai" | "agent" | "system";
export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "audio" | "image" | "video" | "document" | "file" | "location";

export type MessagePreviewDto = {
  body: string;
  author: MessageAuthor;
  direction: MessageDirection;
  createdAt: string;
  id?: string;
  editedAt?: string | null;
} | null;

export type ConversationDto = {
  id: string;
  waPhone: string;
  customerId: string | null;
  customerName?: string | null;
  activeCaseId: string | null;
  status: ConversationStatus;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  /** Cantidad de mensajes no leídos desde la última vez que el asesor abrió el chat. */
  unreadCount: number;
  /** Estado del caso activo si lo hay (aplanado desde el backend). */
  activeCase?: {
    id?: string;
    status: CaseStatus;
    departmentId: string | null;
    assignedAgentId: string | null;
    assignedAgentName?: string | null;
    automationEnabled: boolean;
  };
  /**
   * En resueltas y cerradas: última persona asignada al caso.
   * Es solo un dato para identificar y buscar, no indica atención en curso.
   */
  lastAttendedBy?: {
    agentId: string | null;
    agentName: string | null;
  } | null;
  /** Calculado al leer (JOIN al último message) — nunca se persiste aparte. */
  lastMessagePreview: MessagePreviewDto;
  /**
   * Nombre de perfil/agenda de WhatsApp — real, viene del webhook de Meta
   * (`contacts[].profile.name`), nunca inventado. `null` hasta que llega el
   * primer mensaje del cliente. Nota: WhatsApp NO permite obtener la foto de
   * perfil vía la API oficial (restricción de privacidad de Meta, aplica a
   * cualquier negocio) — por eso solo hay nombre, no foto.
   */
  waProfileName: string | null;
  /** Mensaje histórico coincidente retornado por búsqueda profunda en base de datos. */
  matchedMessage?: {
    id: string;
    body: string;
    author: MessageAuthor;
    createdAt: string;
  } | null;
};

/**
 * Formatea un número de WhatsApp crudo ("593998576466") en algo legible
 * ("+593 998 576 466") — un asesor o un jefe de área no debería leer una
 * cadena de 12 dígitos pegados.
 */
export function formatWaPhone(waPhone: string): string {
  const digits = waPhone.replace(/\D/g, "");
  if (digits.length < 8) return `+${digits}`;
  const cc = digits.slice(0, 3);
  const rest = digits.slice(3);
  const groups = rest.match(/.{1,3}/g) ?? [rest];
  return `+${cc} ${groups.join(" ")}`;
}

/**
 * Nombre a mostrar para un cliente: prioriza el nombre real de su perfil de
 * WhatsApp; si todavía no llegó ningún mensaje con `contacts` en el payload,
 * cae al teléfono formateado — nunca "Cliente" ni un placeholder inventado.
 */
export function conversationDisplayName(
  conversation: Pick<ConversationDto, "waPhone" | "waProfileName"> & {
    customerName?: string | null;
  },
): string {
  return (
    conversation.customerName?.trim() ||
    conversation.waProfileName?.trim() ||
    formatWaPhone(conversation.waPhone)
  );
}

const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Abierta",
  pending: "En espera",
  resolved: "Resuelta",
  closed: "Cerrada",
};

/** Texto claro en español para el estado de la conversación (nunca el enum crudo en inglés). */
export function conversationStatusLabel(status: ConversationStatus): string {
  return CONVERSATION_STATUS_LABELS[status] ?? status;
}

/**
 * Normaliza un texto para búsquedas: minúsculas, sin tildes ni acentos diacríticos, y sin espacios sobrantes.
 */
export function normalizeSearchQuery(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Evalúa si una conversación coincide con un término de búsqueda.
 * Soporta:
 * - Nombres y apellidos del cliente (customerName, waProfileName, displayName)
 * - Teléfono en formato crudo, formateado (+593 ...) o por dígitos (ej. 0986528447 o 986528)
 * - Contenido del último mensaje recibido/enviado
 * - Nombre del agente asignado o que atendió el caso
 * - Insensible a mayúsculas y tildes / diacríticos
 * - Búsqueda de múltiples palabras (ej. "PEREZ SIGUA")
 */
export function matchesConversationSearch(
  c: ConversationDto,
  rawQuery: string,
  extra?: { attendedName?: string | null },
): boolean {
  const query = rawQuery.trim();
  if (!query) return true;

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return true;

  // 1. Textos candidatos
  const candidateTexts: (string | null | undefined)[] = [
    c.customerName,
    c.waProfileName,
    conversationDisplayName(c),
    c.lastMessagePreview?.body,
    extra?.attendedName,
    c.lastAttendedBy?.agentName,
    c.activeCase?.assignedAgentName,
  ];

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const searchableText = candidateTexts
    .filter((t): t is string => Boolean(t && t.trim()))
    .map(normalizeSearchQuery)
    .join(" ");

  const textMatches =
    queryTokens.length > 0 && queryTokens.every((token) => searchableText.includes(token));
  if (textMatches) return true;

  // 2. Coincidencia por teléfono (cadena exacta o formateada)
  const rawPhone = c.waPhone.toLowerCase();
  const formattedPhone = formatWaPhone(c.waPhone).toLowerCase();
  if (rawPhone.includes(normalizedQuery) || formattedPhone.includes(normalizedQuery)) {
    return true;
  }

  // 3. Coincidencia por dígitos numéricos (ej. teléfono local ecuatoriano '098...' vs '+59398...')
  const queryDigits = query.replace(/\D/g, "");
  if (queryDigits.length >= 3) {
    const phoneDigits = c.waPhone.replace(/\D/g, "");
    const queryDigitsWithoutZero = queryDigits.startsWith("0") ? queryDigits.slice(1) : queryDigits;

    if (
      phoneDigits.includes(queryDigits) ||
      (queryDigitsWithoutZero.length >= 3 && phoneDigits.includes(queryDigitsWithoutZero))
    ) {
      return true;
    }
  }

  return false;
}

export type MessageEditHistoryItem = {
  previousBody: string;
  editedAt: string;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  caseId: string | null;
  direction: MessageDirection;
  author: MessageAuthor;
  /** Set en replies humanos (backend 07_QUALITY_SUPERVISION.md §6); null en inbound/ai/system. */
  agentId: string | null;
  agentName?: string | null;
  body: string;
  type: MessageType;
  createdAt: string;
  editedAt?: string | null;
  editHistory?: MessageEditHistoryItem[];
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  mediaUrl?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  errorMessage?: string | null;
};

export type Message = MessageDto;
