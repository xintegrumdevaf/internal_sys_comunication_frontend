import type { MessageDto } from "@/modules/conversations/domain/conversation";

export const MOCK_CONVERSATION_ID = "mock-conv-chat-largo";
export const MOCK_CASE_ID = "mock-case-chat-largo";
export const MOCK_AGENT_ID = "mock-agent-adriana-chalavarri";
export const MOCK_AGENT_NAME = "Adriana Chalavarri";

function mockMsg(
  id: string,
  author: "customer" | "agent" | "system",
  body: string,
  createdAt: string,
  extra: Partial<MessageDto> = {},
): MessageDto {
  const isAgent = author === "agent";
  return {
    id,
    conversationId: MOCK_CONVERSATION_ID,
    caseId: MOCK_CASE_ID,
    direction: author === "customer" ? "inbound" : "outbound",
    author,
    agentId: isAgent ? (extra.agentId ?? MOCK_AGENT_ID) : null,
    agentName: isAgent ? (extra.agentName ?? "ADRIANA CHALAVARRI") : undefined,
    body,
    type: extra.type ?? "text",
    createdAt,
    ...extra,
  };
}

/**
 * 34 mensajes de prueba simulando el caso real de la captura de pantalla:
 * - Demoras SLA con indicadores de "Transcurrieron..." (>20m, >1h)
 * - Múltiples tramos de atención y transferencia de sistema
 * - Mensajes con imágenes y videos adjuntos
 * - Mensajes con faltas asociadas a hallazgos (Ineficiencia, Abandono, Jerga)
 */
export const MOCK_LONG_CHAT_MESSAGES: MessageDto[] = [
  mockMsg(
    "mock-msg-01",
    "customer",
    "Buenos días, tengo problemas con mi conexión de internet desde la mañana.",
    "2026-11-06T09:15:00.000Z",
  ),
  mockMsg(
    "mock-msg-02",
    "agent",
    "Buenos días estimado cliente, bienvenido al soporte técnico. Con gusto le asisto. ¿Me brinda su número de cédula o contrato?",
    "2026-11-06T09:16:20.000Z",
    { agentId: "agent-recepcion", agentName: "Recepción Cartera" },
  ),
  mockMsg(
    "mock-msg-03",
    "customer",
    "Mi cédula es 0987654321, a nombre de Taco Taipe John.",
    "2026-11-06T09:17:15.000Z",
  ),
  mockMsg(
    "mock-msg-04",
    "agent",
    "Gracias Sr. Taco. Voy a transferir su caso al área técnica especializada para que revisen los parámetros de su fibra óptica.",
    "2026-11-06T09:18:40.000Z",
    { agentId: "agent-recepcion", agentName: "Recepción Cartera" },
  ),
  mockMsg(
    "mock-msg-05",
    "system",
    "Caso transferido a Adriana Chalavarri por Recepción Cartera",
    "2026-11-06T09:20:00.000Z",
  ),
  mockMsg(
    "mock-msg-06",
    "agent",
    "por favor un momento, estamos validando nuevamente",
    "2026-11-06T10:33:00.000Z",
  ),
  mockMsg("mock-msg-07", "customer", "Ok muchas gracias", "2026-11-06T10:35:00.000Z"),
  // Lapso SLA de 1h 15m (10:35 -> 11:50)
  mockMsg("mock-msg-08", "agent", "Por favor valide nuevamente", "2026-11-06T11:50:00.000Z"),
  mockMsg("mock-msg-09", "customer", "Voy a revisar", "2026-11-06T11:51:10.000Z"),
  mockMsg("mock-msg-10", "customer", "No abre la página", "2026-11-06T11:53:20.000Z"),
  // Lapso de 22 minutos (11:53 -> 12:15)
  mockMsg("mock-msg-11", "customer", "Ahora me sale haci", "2026-11-06T12:15:00.000Z", {
    type: "image",
    caption: "Ahora me sale haci",
    mediaUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
  }),
  mockMsg(
    "mock-msg-12",
    "agent",
    "borre las cookies de su navegador por favor",
    "2026-11-06T12:16:30.000Z",
  ),
  mockMsg("mock-msg-13", "agent", "cambie de navegador por favor", "2026-11-06T12:18:00.000Z"),
  mockMsg("mock-msg-14", "customer", "Tampoco me vale", "2026-11-06T12:21:00.000Z", {
    type: "video",
    caption: "Video adjunto: Error ERR_CONNECTION_TIMED_OUT",
  }),
  mockMsg("mock-msg-15", "customer", "Le ayudo con otro de esto !!", "2026-11-06T12:21:45.000Z"),
  mockMsg(
    "mock-msg-16",
    "customer",
    "Imagen adjunta de configuración de red",
    "2026-11-06T12:23:10.000Z",
    {
      type: "image",
      caption: "Captura de pantalla de ajustes de red",
      mediaUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
    },
  ),
  mockMsg(
    "mock-msg-17",
    "agent",
    "por favor valide el acceso en incognito",
    "2026-11-06T12:25:30.000Z",
  ),
  mockMsg(
    "mock-msg-18",
    "customer",
    "Ya probé en modo incógnito también y sigue el mismo problema.",
    "2026-11-06T12:27:00.000Z",
  ),
  mockMsg(
    "mock-msg-19",
    "customer",
    "tampoco me sale la opcion que dice",
    "2026-11-06T12:30:00.000Z",
  ),
  // Lapso SLA de 45 minutos (12:30 -> 13:15)
  mockMsg(
    "mock-msg-20",
    "customer",
    "Hola?? Sigo esperando respuesta, necesito trabajar con urgencia.",
    "2026-11-06T13:15:00.000Z",
  ),
  mockMsg(
    "mock-msg-21",
    "agent",
    "dado que estoy validando desde la misma ip, y si tengo salida a la pg",
    "2026-11-06T13:18:00.000Z",
  ),
  mockMsg("mock-msg-22", "customer", "Deje*", "2026-11-06T13:19:20.000Z"),
  mockMsg("mock-msg-23", "customer", "Tampoco me deja", "2026-11-06T13:21:00.000Z", {
    type: "video",
    caption: "Video adjunto navegando sin respuesta",
  }),
  mockMsg(
    "mock-msg-24",
    "customer",
    "En mi celular conectado al wifi tampoco abre esa página.",
    "2026-11-06T13:22:30.000Z",
  ),
  mockMsg(
    "mock-msg-25",
    "agent",
    "Entiendo. Procedo a verificar el perfil de navegación y la asignación de DNS en su sesión PPPoE.",
    "2026-11-06T13:24:10.000Z",
  ),
  mockMsg(
    "mock-msg-26",
    "agent",
    "He refrescado la tabla ARP y los DNS primarios a 1.1.1.1 y secundarios a 8.8.8.8. Por favor desconecte el router de la energía por 30 segundos.",
    "2026-11-06T13:26:40.000Z",
  ),
  mockMsg(
    "mock-msg-27",
    "customer",
    "De acuerdo, ya lo desenchufé. Voy a esperar el medio minuto.",
    "2026-11-06T13:28:00.000Z",
  ),
  mockMsg(
    "mock-msg-28",
    "customer",
    "Ya lo volví a conectar. Están parpadeando las luces de PON y LOS.",
    "2026-11-06T13:30:15.000Z",
  ),
  mockMsg(
    "mock-msg-29",
    "agent",
    "La luz LOS debe quedar apagada y la luz PON fija en color verde. Confírmeme cuando esté fija por favor.",
    "2026-11-06T13:31:30.000Z",
  ),
  mockMsg(
    "mock-msg-30",
    "customer",
    "Sí, ya quedó fija en verde la luz PON y la luz LOS se apagó.",
    "2026-11-06T13:33:00.000Z",
  ),
  mockMsg(
    "mock-msg-31",
    "agent",
    "Perfecto. Por favor pruebe ahora abrir la página web desde su computador.",
    "2026-11-06T13:34:20.000Z",
  ),
  mockMsg(
    "mock-msg-32",
    "customer",
    "Excelente!! Ya cargó de una la página y el streaming también se activó. Muchas gracias.",
    "2026-11-06T13:36:00.000Z",
  ),
  mockMsg(
    "mock-msg-33",
    "agent",
    "Me alegra mucho que esté operativo. ¿Hay alguna otra inquietud en la que le pueda colaborar el día de hoy?",
    "2026-11-06T13:37:10.000Z",
  ),
  mockMsg(
    "mock-msg-34",
    "customer",
    "No, todo solucionado. Que tenga un buen día.",
    "2026-11-06T13:38:00.000Z",
  ),
];
