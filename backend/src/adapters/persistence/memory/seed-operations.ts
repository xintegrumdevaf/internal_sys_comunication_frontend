import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { Message } from "@/core/modules/conversations/domain/message";
import type { Transfer } from "@/core/modules/conversations/domain/transfer";
import type { AuditEvent } from "@/core/modules/auditing/domain/audit-event";
import {
  asAuditEventId,
  asConversationId,
  asDepartmentId,
  asMessageId,
  asTransferId,
  asUserId,
} from "@/core/shared/domain/ids";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

export type CustomerProfile = {
  contractId: string;
  name: string;
  plan: string;
  billingStatus: "al_dia" | "mora" | "revision";
  sector: string;
  address: string;
  lastVisit?: string;
  onuPowerDbm?: number;
};

export type PaymentCase = {
  conversationId: string;
  contrato: string;
  cliente: string;
  monto: number;
  fecha: string;
  metodo: string;
  estado: "VALIDADO" | "OCR PENDIENTE" | "RECHAZADO";
};

export type WorkOrder = {
  conversationId: string;
  id: string;
  tipo: string;
  direccion: string;
  tecnico: string;
  ventana: string;
  estado: string;
};

export const SEED_CUSTOMERS: Record<string, CustomerProfile> = {
  "4521": {
    contractId: "4521",
    name: "María Peña",
    plan: "300 Mbps",
    billingStatus: "al_dia",
    sector: "Sector A",
    address: "Cra 21 #45-12",
    lastVisit: "03 Mar 2026",
    onuPowerDbm: -27.4,
  },
  "3187": {
    contractId: "3187",
    name: "Luis Ramírez",
    plan: "200 Mbps",
    billingStatus: "mora",
    sector: "Sector B",
    address: "Cll 18 #4-22",
    onuPowerDbm: -18.2,
  },
  "5502": {
    contractId: "5502",
    name: "Ana Vargas",
    plan: "500 Mbps",
    billingStatus: "al_dia",
    sector: "Sector C",
    address: "Cra 9 #12-01",
  },
  "6741": {
    contractId: "6741",
    name: "Sofía Ortiz",
    plan: "100 Mbps",
    billingStatus: "mora",
    sector: "Sector D",
    address: "Cll 44 #22-9",
  },
  "2210": {
    contractId: "2210",
    name: "Jorge Peláez",
    plan: "300 Mbps",
    billingStatus: "al_dia",
    sector: "Sector B",
    address: "Cra 34 #7-88",
    onuPowerDbm: -29.1,
  },
  "8801": {
    contractId: "8801",
    name: "Carlos Ruiz",
    plan: "200 Mbps",
    billingStatus: "revision",
    sector: "Sector A",
    address: "Av 5 #10-20",
  },
};

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: asConversationId("conv_soporte_onu"),
    waPhone: "+57 301 445 8890",
    customerName: "María Peña",
    contractId: "4521",
    departmentId: asDepartmentId("dept_soporte"),
    status: "open",
    handlerMode: "ai",
    intent: "dano",
    lastMessagePreview: "No tengo internet, la luz de la ONU parpadea…",
    createdAt: minutesAgo(40),
    updatedAt: minutesAgo(2),
  },
  {
    id: asConversationId("conv_cartera_pago"),
    waPhone: "+57 310 220 1188",
    customerName: "Carlos Ruiz",
    contractId: "8801",
    departmentId: asDepartmentId("dept_cartera"),
    status: "pending",
    handlerMode: "human",
    assigneeId: asUserId("u_cartera"),
    intent: "pago",
    lastMessagePreview: "Envío comprobante de pago del mes…",
    createdAt: minutesAgo(55),
    updatedAt: minutesAgo(10),
  },
  {
    id: asConversationId("conv_traslados_cobertura"),
    waPhone: "+57 322 890 1122",
    customerName: "Prospecto Sector B",
    departmentId: asDepartmentId("dept_traslados"),
    status: "open",
    handlerMode: "ai",
    intent: "instalacion",
    lastMessagePreview: "Quiero saber si hay cobertura en Sector B…",
    createdAt: minutesAgo(60),
    updatedAt: minutesAgo(15),
  },
  {
    id: asConversationId("conv_cartera_boucher"),
    waPhone: "+57 315 441 9021",
    customerName: "María Peña",
    contractId: "4521",
    departmentId: asDepartmentId("dept_cartera"),
    status: "open",
    handlerMode: "ai",
    intent: "pago",
    lastMessagePreview: "Adjunto boucher de $85.000 — Contrato 4521",
    createdAt: minutesAgo(80),
    updatedAt: minutesAgo(22),
  },
  {
    id: asConversationId("conv_traslados_mudanza"),
    waPhone: "+57 318 220 4410",
    customerName: "Sofía Ortiz",
    contractId: "6741",
    departmentId: asDepartmentId("dept_traslados"),
    status: "pending",
    handlerMode: "human",
    assigneeId: asUserId("u_utga"),
    intent: "traslado",
    lastMessagePreview: "Necesito traslado de mi servicio a nueva dirección",
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(34),
  },
  {
    id: asConversationId("conv_soporte_velocidad"),
    waPhone: "+57 300 111 2233",
    customerName: "Luis Ramírez",
    contractId: "3187",
    departmentId: asDepartmentId("dept_soporte"),
    status: "open",
    handlerMode: "ai",
    intent: "velocidad",
    lastMessagePreview: "La velocidad está muy lenta desde ayer",
    createdAt: minutesAgo(90),
    updatedAt: minutesAgo(18),
  },
  {
    id: asConversationId("conv_ti_alerta"),
    waPhone: "+57 301 000 0001",
    customerName: "Monitor OLT",
    contractId: "2210",
    departmentId: asDepartmentId("dept_ti"),
    status: "open",
    handlerMode: "ai",
    intent: "infra",
    lastMessagePreview: "Alerta ONU potencia -29.1 dBm — requiere revisión",
    createdAt: minutesAgo(25),
    updatedAt: minutesAgo(5),
  },
  {
    id: asConversationId("conv_admin_campana"),
    waPhone: "+57 320 555 7788",
    customerName: "Ana Vargas",
    contractId: "5502",
    departmentId: asDepartmentId("dept_admin"),
    status: "resolved",
    handlerMode: "ai",
    intent: "campana",
    lastMessagePreview: "Confirmó recepción de recordatorio de pago",
    createdAt: minutesAgo(200),
    updatedAt: minutesAgo(50),
  },
];

export const SEED_MESSAGES: Message[] = [
  // soporte ONU
  {
    id: asMessageId("msg_1"),
    conversationId: asConversationId("conv_soporte_onu"),
    direction: "inbound",
    author: "customer",
    body: "Hola, no tengo internet desde ayer en la noche. La luz roja de la ONU está parpadeando.",
    createdAt: minutesAgo(38),
  },
  {
    id: asMessageId("msg_2"),
    conversationId: asConversationId("conv_soporte_onu"),
    direction: "outbound",
    author: "ai",
    body: "Hola María. Detecté tu contrato #4521. Estoy consultando el estado de tu equipo en la OLT…",
    createdAt: minutesAgo(37),
  },
  {
    id: asMessageId("msg_3"),
    conversationId: asConversationId("conv_soporte_onu"),
    direction: "outbound",
    author: "ai",
    body: "Lectura ONU: potencia RX -27.4 dBm (crítico). Genero visita técnica prioritaria.",
    createdAt: minutesAgo(35),
  },
  {
    id: asMessageId("msg_4"),
    conversationId: asConversationId("conv_soporte_onu"),
    direction: "inbound",
    author: "customer",
    body: "¿Cuándo viene el técnico? Necesito trabajar.",
    createdAt: minutesAgo(5),
  },
  {
    id: asMessageId("msg_5"),
    conversationId: asConversationId("conv_soporte_onu"),
    direction: "outbound",
    author: "ai",
    body: "Cuadrilla asignada — ventana 14:00 a 16:00 hoy. Ticket #9921. ¿Confirmas la dirección Cra 21 #45-12?",
    createdAt: minutesAgo(2),
  },
  // cartera pago
  {
    id: asMessageId("msg_6"),
    conversationId: asConversationId("conv_cartera_pago"),
    direction: "inbound",
    author: "customer",
    body: "Envío comprobante de pago del mes. Contrato 8801.",
    createdAt: minutesAgo(20),
  },
  {
    id: asMessageId("msg_7"),
    conversationId: asConversationId("conv_cartera_pago"),
    direction: "outbound",
    author: "agent",
    body: "Recibido Carlos. Estoy validando el boucher con OCR…",
    createdAt: minutesAgo(12),
  },
  {
    id: asMessageId("msg_8"),
    conversationId: asConversationId("conv_cartera_pago"),
    direction: "outbound",
    author: "agent",
    body: "Monto detectado $62.000 · Nequi. Queda pendiente confirmación bancaria.",
    createdAt: minutesAgo(10),
  },
  // traslados
  {
    id: asMessageId("msg_9"),
    conversationId: asConversationId("conv_traslados_mudanza"),
    direction: "inbound",
    author: "customer",
    body: "Necesito traslado de mi servicio a Cll 9 #12-30, Sector C.",
    createdAt: minutesAgo(40),
  },
  {
    id: asMessageId("msg_10"),
    conversationId: asConversationId("conv_traslados_mudanza"),
    direction: "outbound",
    author: "agent",
    body: "Hola Sofía. Validé cobertura en Sector C. OT-4470 programada para hoy 16:30–18:00.",
    createdAt: minutesAgo(34),
  },
  // cartera boucher
  {
    id: asMessageId("msg_11"),
    conversationId: asConversationId("conv_cartera_boucher"),
    direction: "inbound",
    author: "customer",
    body: "Adjunto boucher de $85.000 — Contrato 4521 Bancolombia.",
    createdAt: minutesAgo(25),
  },
  {
    id: asMessageId("msg_12"),
    conversationId: asConversationId("conv_cartera_boucher"),
    direction: "outbound",
    author: "ai",
    body: "Comprobante leído. Monto $85.000 validado automáticamente.",
    createdAt: minutesAgo(22),
  },
];

export const SEED_TRANSFERS: Transfer[] = [
  {
    id: asTransferId("trf_1"),
    conversationId: asConversationId("conv_traslados_mudanza"),
    fromDepartmentId: asDepartmentId("dept_soporte"),
    toDepartmentId: asDepartmentId("dept_traslados"),
    requestedByUserId: asUserId("u_soporte"),
    reason: "Cliente solicita mudanza — requiere OT UTGA",
    createdAt: minutesAgo(45),
  },
];

export const SEED_AUDIT: AuditEvent[] = [
  {
    id: asAuditEventId("aud_1"),
    action: "AUTH_OK",
    actorUserId: asUserId("u_admin"),
    resourceType: "session",
    resourceId: "sess_demo",
    metadata: { user: "Javier Díaz" },
    createdAt: minutesAgo(90),
  },
  {
    id: asAuditEventId("aud_2"),
    action: "MESSAGE_RECEIVED",
    resourceType: "message",
    resourceId: "msg_1",
    metadata: { conversationId: "conv_soporte_onu", departmentSlug: "soporte" },
    createdAt: minutesAgo(38),
  },
  {
    id: asAuditEventId("aud_3"),
    action: "CONVERSATION_OPENED",
    resourceType: "conversation",
    resourceId: "conv_soporte_onu",
    metadata: { departmentSlug: "soporte" },
    createdAt: minutesAgo(40),
  },
  {
    id: asAuditEventId("aud_4"),
    action: "TRANSFER",
    actorUserId: asUserId("u_soporte"),
    resourceType: "conversation",
    resourceId: "conv_traslados_mudanza",
    metadata: { from: "soporte", to: "traslados" },
    createdAt: minutesAgo(45),
  },
  {
    id: asAuditEventId("aud_5"),
    action: "TAKE_CONTROL",
    actorUserId: asUserId("u_cartera"),
    resourceType: "conversation",
    resourceId: "conv_cartera_pago",
    createdAt: minutesAgo(15),
  },
  {
    id: asAuditEventId("aud_6"),
    action: "HANDOVER",
    resourceType: "conversation",
    resourceId: "conv_soporte_onu",
    metadata: { reason: "Potencia crítica — posible visita" },
    createdAt: minutesAgo(3),
  },
];

export const SEED_PAYMENTS: PaymentCase[] = [
  {
    conversationId: "conv_cartera_boucher",
    contrato: "4521",
    cliente: "María Peña",
    monto: 85000,
    fecha: "27 Jul 2026",
    metodo: "Bancolombia",
    estado: "VALIDADO",
  },
  {
    conversationId: "conv_cartera_pago",
    contrato: "8801",
    cliente: "Carlos Ruiz",
    monto: 62000,
    fecha: "27 Jul 2026",
    metodo: "Nequi",
    estado: "OCR PENDIENTE",
  },
  {
    conversationId: "conv_admin_campana",
    contrato: "5502",
    cliente: "Ana Vargas",
    monto: 120000,
    fecha: "26 Jul 2026",
    metodo: "Daviplata",
    estado: "VALIDADO",
  },
  {
    conversationId: "conv_traslados_mudanza",
    contrato: "6741",
    cliente: "Sofía Ortiz",
    monto: 45000,
    fecha: "26 Jul 2026",
    metodo: "PSE",
    estado: "RECHAZADO",
  },
];

export const SEED_WORK_ORDERS: WorkOrder[] = [
  {
    conversationId: "conv_soporte_onu",
    id: "OT-4471",
    tipo: "Reparación (visita)",
    direccion: "Cra 21 #45-12, Sector A",
    tecnico: "L. Muñoz",
    ventana: "Hoy 14:00–16:00",
    estado: "En ruta",
  },
  {
    conversationId: "conv_traslados_mudanza",
    id: "OT-4470",
    tipo: "Traslado de servicio",
    direccion: "Cll 9 #12-30, Sector C",
    tecnico: "P. Cárdenas",
    ventana: "Hoy 16:30–18:00",
    estado: "Programada",
  },
  {
    conversationId: "conv_traslados_cobertura",
    id: "OT-4465",
    tipo: "Instalación nueva",
    direccion: "Sector B — por confirmar",
    tecnico: "—",
    ventana: "—",
    estado: "Viabilidad",
  },
  {
    conversationId: "conv_ti_alerta",
    id: "OT-4468",
    tipo: "Reparación (visita)",
    direccion: "Cra 34 #7-88, Sector B",
    tecnico: "J. Ruiz",
    ventana: "Mañana 09:00",
    estado: "Confirmada",
  },
];
