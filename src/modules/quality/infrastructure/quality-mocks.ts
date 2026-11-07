import type { QualityReviewDto } from "@/modules/quality/domain/quality-review";
import { MOCK_AGENT_ID, MOCK_CASE_ID, MOCK_CONVERSATION_ID } from "./quality-mock-messages";

export {
  MOCK_AGENT_ID,
  MOCK_AGENT_NAME,
  MOCK_CASE_ID,
  MOCK_CONVERSATION_ID,
  MOCK_LONG_CHAT_MESSAGES,
} from "./quality-mock-messages";

export const MOCK_QUALITY_REVIEW_ID = "mock-chat-largo-scroll";

/**
 * Mock completo para probar el comportamiento de scroll en chats largos (34 msgs)
 * y análisis multi-tramo enriquecido (3 tramos, 3 hallazgos, notas de coaching).
 */
export const MOCK_LONG_QUALITY_REVIEW: QualityReviewDto = {
  id: MOCK_QUALITY_REVIEW_ID,
  conversationId: MOCK_CONVERSATION_ID,
  caseId: MOCK_CASE_ID,
  agentId: MOCK_AGENT_ID,
  departmentId: "dept-soporte",
  cordialityScore: 48,
  efficiencyNotes:
    "Se observa una ineficiencia operativa significativa debido a la fragmentación de las instrucciones. El agente envía cada paso de forma aislada con intervalos de tiempo prolongados entre ellos, lo que genera una experiencia de usuario lenta y frustrante en lugar de proporcionar una guía integral.",
  summary: `Valoración total: 48/100 (requiere atención).
Conversación completa: 34 mensaje(s) en 3 tramo(s).

Síntesis por tramos:
1. (1) FALTAS DETECTADAS: Desempeño deficiente caracterizado por comunicación fragmentada, falta de empatía y pruebas de ensayo y error sin orden lógico. (2) CONTEXTO Y MOTIVO: El cliente contactó por imposibilidad de acceder a páginas web y streaming teniendo señal wifi activa. (3) RECOMENDACIÓN PEDAGÓGICA: Adoptar un enfoque consultivo explicando el porqué de cada paso técnico. Ejemplo de respuesta adecuada: 'Buenos días Sr. Taco, con gusto le ayudo a verificar su conexión. Vamos a realizar un diagnóstico paso a paso para identificar si el inconveniente proviene de la señal óptica o de la configuración del equipo.'
2. (1) FALTAS DETECTADAS: Instrucciones atomizadas en mensajes breves sin contexto ('borre cookies', 'cambie de navegador') y demora de 45 minutos sin dar seguimiento al cliente. (2) CONTEXTO Y MOTIVO: El abonado envió capturas en imagen y video reportando que continuaba sin acceso. (3) RECOMENDACIÓN PEDAGÓGICA: Enviar un plan de acción integral en una sola intervención y mantener informado al usuario si una prueba toma tiempo. Ejemplo de respuesta adecuada: 'Entiendo que el fallo persiste. Para descartar errores de caché o navegador, por favor realice estas tres pruebas: 1) Borre historial y cookies, 2) Acceda en modo incógnito, y 3) Pruebe desde otro dispositivo. Quedo atento a sus resultados.'
3. (1) FALTAS DETECTADAS: Justificación defensiva frente al reporte del cliente ('dado que estoy validando desde la misma ip, y si tengo salida') en lugar de verificar el enlace del usuario. (2) CONTEXTO Y MOTIVO: El cliente confirmó que el router no le permitía navegar y envió un segundo video comprobando la falla. (3) RECOMENDACIÓN PEDAGÓGICA: Refrescar la sesión PPPoE/DNS de forma directa o escalar a soporte nivel 2 sin culpar al abonado. Ejemplo de respuesta adecuada: 'Comprendo su malestar. He procedido a refrescar la sesión PPPoE y los servidores DNS en su ONT. Le solicito reiniciar el router durante 30 segundos para confirmar la resolución.'`,
  errorMessage: null,
  status: "ready",
  trigger: "auto_case_closed",
  customerLabel: "[TEST SCROLL] Taco Taipe John (34 msgs)",
  waPhone: "593987654321",
  waProfileName: "John Taco",
  highFindingCount: 1,
  findingCount: 3,
  findings: [
    {
      id: "mock-f-01",
      messageId: "mock-msg-12",
      severity: "medium",
      category: "inefficiency",
      excerpt: "borre las cookies de su navegador por favor",
      rationale:
        "El agente proporciona instrucciones de forma atomizada y sin contexto, obligando al cliente a esperar una nueva instrucción tras otra en lugar de ofrecer un plan de acción claro.",
      recommendation:
        "Explicar el procedimiento completo en una sola intervención: 'Por favor realice estas tres pruebas: 1) Borrar historial y cookies, 2) Intentar en modo incógnito, y 3) Probar desde otro navegador'.",
    },
    {
      id: "mock-f-02",
      messageId: "mock-msg-19",
      severity: "high",
      category: "neglect",
      excerpt: "tampoco me sale la opcion que dice",
      rationale:
        "Demora excesiva de más de 45 minutos sin responder tras confirmación del cliente y falta de seguimiento proactivo.",
      recommendation:
        "Si la validación tomará tiempo, avisar al cliente: 'Estamos revisando en el sistema central, tardaremos unos 5 minutos' y mantener la comunicación.",
    },
    {
      id: "mock-f-03",
      messageId: "mock-msg-21",
      severity: "medium",
      category: "misinformation",
      excerpt: "dado que estoy validando desde la misma ip, y si tengo salida a la pg",
      rationale:
        "Uso de jerga técnica innecesaria y justificación defensiva frente al problema reportado por el usuario.",
      recommendation:
        "Evitar tecnicismos como 'salida a la pg' o 'misma ip'. En su lugar validar la configuración de DNS o enrutamiento del lado del cliente de forma empática.",
    },
  ],
  notes: [
    {
      id: "mock-note-01",
      reviewId: MOCK_QUALITY_REVIEW_ID,
      authorAgentId: "agent-supervisor",
      body: "Se revisó la sesión con el asesor. Se acordó estructurar las respuestas de soporte en bloques de pasos numerados para no enviar micro-mensajes que desgasten al cliente.",
      ackStatus: "acknowledged",
      acknowledgedAt: "2026-11-06T14:30:00.000Z",
      createdAt: "2026-11-06T14:00:00.000Z",
    },
    {
      id: "mock-note-02",
      reviewId: MOCK_QUALITY_REVIEW_ID,
      authorAgentId: "agent-supervisor",
      body: "Reforzar empatía en demoras prolongadas (>20 min) manteniendo informado al cliente sobre el estado de la validación.",
      ackStatus: "open",
      acknowledgedAt: null,
      createdAt: "2026-11-06T15:10:00.000Z",
    },
  ],
  messagesTotal: 34,
  messagesAnalyzed: 34,
  chunkSize: 15,
  startedAt: "2026-11-06T09:15:00.000Z",
  createdAt: "2026-11-06T13:40:00.000Z",
  completedAt: "2026-11-06T13:42:00.000Z",
};
