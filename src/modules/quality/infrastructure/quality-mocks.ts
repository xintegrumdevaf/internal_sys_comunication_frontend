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

Puntos a mejorar (3):
- [Ineficiencia] «borre las cookies de su navegador por favor» — El agente proporciona instrucciones de forma atomizada y sin contexto, obligando al cliente a esperar una nueva instrucción tras otra en lugar de ofrecer un plan de acción claro.
- [Abandono] «tampoco me sale la opcion que dice» — Demora de más de 45 minutos en responder tras prueba del cliente.
- [Comunicación] «dado que estoy validando desde la misma ip, y si tengo salida a la pg» — Explicación excesivamente técnica y defensiva.

Eficiencia: Se observa una ineficiencia operativa significativa debido a la fragmentación de las instrucciones. El agente envía cada paso de forma aislada con intervalos de tiempo prolongados entre ellos, lo que genera una experiencia de usuario lenta y frustrante en lugar de proporcionar una guía integral.

Síntesis por tramos:
1. El cliente contactó por problemas de acceso a un servicio web. El desempeño del agente fue deficiente, caracterizado por una comunicación fragmentada, falta de empatía y una gestión técnica basada en pruebas de ensayo y error sin una estructura lógica. Se recomienda al agente adoptar un enfoque consultivo, explicando el 'porqué' de cada paso técnico y manteniendo una comunicación fluida en lugar de enviar instrucciones aisladas que generan frustración.
2. (1) FALTAS DETECTADAS: No se detectan faltas de respeto ni agresividad. Sin embargo, se observa una comunicación excesivamente fragmentada y técnica que carece de empatía y de una estructura de soporte clara. (2) CONTEXTO Y MOTIVO: El cliente presenta dificultades de acceso a una página web o servicio. El agente intenta resolverlo mediante una serie de pasos técnicos (borrar cookies, cambiar navegador, modo incógnito, probar en otro dispositivo). (3) RECOMENDACIÓN PEDAGÓGICA: El agente debe evitar enviar instrucciones aisladas y breves. Es necesario agrupar los pasos en una sola respuesta estructurada para no saturar al cliente y explicar el 'porqué' de cada acción. Ejemplo de respuesta adecuada: 'Entiendo que sigue teniendo problemas para acceder. Para descartar errores de caché, por favor realice estas tres pruebas: 1) Borre el historial y cookies de su navegador, 2) Intente acceder desde una ventana en modo incógnito y 3) Pruebe desde otro navegador o dispositivo. Quedo atento a sus resultados para seguir ayudándole.'
3. (1) FALTAS DETECTADAS: Justificación técnica defensiva ('dado que estoy validando desde la misma ip') y prolongación innecesaria del tiempo de atención. El agente reporta 'yo sí tengo salida' en lugar de empatizar con la falla reportada por el abonado. (2) CONTEXTO Y MOTIVO: El cliente continúa sin poder ingresar tras múltiples intentos y adjunta capturas en video e imagen. (3) RECOMENDACIÓN PEDAGÓGICA: Escalar el caso o verificar el enrutamiento y DNS de la sesión PPPoE de forma directa sin culpar la red local del usuario. Ejemplo de respuesta adecuada: 'Comprendo la situación y veo que las pruebas de navegador no dieron resultado. Voy a refrescar el perfil de navegación y la asignación de DNS en su enlace. Le pido que reinicie su router 30 segundos y verificamos juntos.'`,
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
