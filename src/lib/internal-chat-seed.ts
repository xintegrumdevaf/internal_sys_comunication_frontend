import type { ConversationDto } from "@/adapters/http/dto";
import type { MentionTarget } from "@/lib/internal-chat-types";

export const SEED_MENTION_TARGETS: MentionTarget[] = [
  {
    type: "conversation",
    targetId: "conv_demo_ana",
    label: "Ana López — Contrato #4521",
    customerName: "Ana López",
    contractId: "4521",
    conversationId: "conv_demo_ana",
    department: "soporte",
    status: "open",
    preview: "Sigue sin internet desde ayer…",
  },
  {
    type: "conversation",
    targetId: "conv_demo_carlos",
    label: "Carlos Ruiz — Contrato #8890",
    customerName: "Carlos Ruiz",
    contractId: "8890",
    conversationId: "conv_demo_carlos",
    department: "cartera",
    status: "open",
    preview: "Envié el comprobante hace rato",
  },
  {
    type: "customer",
    targetId: "4521",
    label: "Ana López — #4521",
    customerName: "Ana López",
    contractId: "4521",
    conversationId: "conv_demo_ana",
    department: "soporte",
    status: "open",
  },
  {
    type: "customer",
    targetId: "8890",
    label: "Carlos Ruiz — #8890",
    customerName: "Carlos Ruiz",
    contractId: "8890",
    conversationId: "conv_demo_carlos",
    department: "cartera",
    status: "open",
  },
  {
    type: "customer",
    targetId: "3102",
    label: "Diana Soto — #3102",
    customerName: "Diana Soto",
    contractId: "3102",
    department: "traslados",
    status: "open",
  },
];

export function targetsFromConversations(conversations: ConversationDto[]): MentionTarget[] {
  const byConv: MentionTarget[] = conversations.map((c) => ({
    type: "conversation" as const,
    targetId: c.id,
    label: `${c.customerName ?? c.waPhone}${c.contractId ? ` — Contrato #${c.contractId}` : ""}`,
    customerName: c.customerName ?? c.waPhone,
    contractId: c.contractId,
    conversationId: c.id,
    department: c.departmentId,
    status: c.status,
    preview: c.lastMessagePreview,
  }));

  const customers = new Map<string, MentionTarget>();
  for (const c of conversations) {
    if (!c.contractId) continue;
    if (customers.has(c.contractId)) continue;
    customers.set(c.contractId, {
      type: "customer",
      targetId: c.contractId,
      label: `${c.customerName ?? "Cliente"} — #${c.contractId}`,
      customerName: c.customerName ?? "Cliente",
      contractId: c.contractId,
      conversationId: c.id,
      department: c.departmentId,
      status: c.status,
    });
  }

  return [...byConv, ...customers.values()];
}

/** Si hay datos reales, no mezclar seed (evita deep-links rotos). */
export function mergeMentionTargets(
  fromApi: MentionTarget[],
  seed: MentionTarget[] = SEED_MENTION_TARGETS,
): MentionTarget[] {
  return fromApi.length > 0 ? fromApi : seed;
}
