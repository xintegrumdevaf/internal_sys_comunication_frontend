import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getContainer } from "@/core/composition/container";
import {
  toAuditDto,
  toConversationDto,
  toDepartmentDto,
  toMessageDto,
  toUserDto,
} from "@/adapters/http/dto";
import { asConversationId, asDepartmentId, asUserId } from "@/core/shared/domain/ids";
import { DomainError } from "@/core/shared/domain/errors";
import {
  isGlobalAdmin,
  userBelongsToDepartment,
  userDepartmentIds,
} from "@/core/modules/identity/domain/user";
import {
  SEED_CUSTOMERS,
  SEED_PAYMENTS,
  SEED_WORK_ORDERS,
} from "@/adapters/persistence/memory/seed-operations";
import { SEED_DEPARTMENTS } from "@/adapters/persistence/memory/seed";
import {
  getWhatsAppCloudConfig,
  isWhatsAppCloudConfigured,
} from "@/adapters/whatsapp-cloud/config";

function rethrowDomain(error: unknown): never {
  if (error instanceof DomainError) {
    throw new Error(`${error.code}: ${error.message}`);
  }
  throw error;
}

export const listDepartmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const items = await getContainer().useCases.listDepartments.execute();
  return items.map(toDepartmentDto);
});

export const listUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  const items = await getContainer().useCases.listUsers.execute();
  return items.map(toUserDto);
});

export const listConversationsFn = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        departmentId: z.string().optional(),
        departmentSlug: z.string().optional(),
        userId: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const container = getContainer();

    if (data?.userId && !data.departmentSlug && !data.departmentId) {
      const items = await container.useCases.listInboxForUser.execute(asUserId(data.userId));
      return items.map(toConversationDto);
    }

    let departmentId = data?.departmentId;
    if (!departmentId && data?.departmentSlug) {
      const dept = await container.departments.findBySlug(data.departmentSlug);
      departmentId = dept?.id;
    }

    if (departmentId && data?.userId) {
      const user = await container.users.findById(asUserId(data.userId));
      if (!user || !userBelongsToDepartment(user, asDepartmentId(departmentId))) {
        return [];
      }
    }

    // Sin userId no devolvemos datos de departamento (evita fugas en mock)
    if (departmentId && !data?.userId) {
      return [];
    }

    const items = await container.useCases.listConversations.execute({
      departmentId: departmentId ? asDepartmentId(departmentId) : undefined,
    });
    return items.map(toConversationDto);
  });

export const listMessagesFn = createServerFn({ method: "GET" })
  .validator(z.object({ conversationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const items = await getContainer().useCases.listMessages.execute(
      asConversationId(data.conversationId),
    );
    return items.map(toMessageDto);
  });

export const getConversationContextFn = createServerFn({ method: "GET" })
  .validator(z.object({ conversationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const container = getContainer();
    const conversation = await container.conversations.findById(
      asConversationId(data.conversationId),
    );
    if (!conversation) return null;

    const department =
      (await container.departments.findById(conversation.departmentId)) ?? null;
    const customer = conversation.contractId
      ? (SEED_CUSTOMERS[conversation.contractId] ?? null)
      : null;
    const payment = SEED_PAYMENTS.find((p) => p.conversationId === conversation.id) ?? null;
    const workOrder = SEED_WORK_ORDERS.find((w) => w.conversationId === conversation.id) ?? null;

    return {
      conversation: toConversationDto(conversation),
      department: department ? toDepartmentDto(department) : null,
      customer,
      payment,
      workOrder,
      transferTargets: SEED_DEPARTMENTS.filter(
        (d) => d.active && d.id !== conversation.departmentId,
      ).map(toDepartmentDto),
    };
  });

export const takeControlFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      conversationId: z.string().min(1),
      agentUserId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const conversation = await getContainer().useCases.takeControl.execute({
        conversationId: asConversationId(data.conversationId),
        agentUserId: asUserId(data.agentUserId),
      });
      return toConversationDto(conversation);
    } catch (error) {
      rethrowDomain(error);
    }
  });

export const transferConversationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      conversationId: z.string().min(1),
      toDepartmentSlug: z.string().min(1),
      requestedByUserId: z.string().min(1),
      reason: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const result = await getContainer().useCases.transferConversation.execute({
        conversationId: asConversationId(data.conversationId),
        toDepartmentSlug: data.toDepartmentSlug,
        requestedByUserId: asUserId(data.requestedByUserId),
        reason: data.reason,
      });
      return {
        conversation: toConversationDto(result.conversation),
        transferId: result.transfer.id,
      };
    } catch (error) {
      rethrowDomain(error);
    }
  });

export const listAuditEventsFn = createServerFn({ method: "GET" })
  .validator(z.object({ limit: z.number().int().positive().max(200).optional() }).optional())
  .handler(async ({ data }) => {
    const items = await getContainer().audit.listRecent(data?.limit ?? 50);
    return items.map(toAuditDto);
  });

export const getDepartmentBoardFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      departmentSlug: z.string().min(1),
      userId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const user = await container.users.findById(asUserId(data.userId));
    if (!user) {
      return { department: null, conversations: [], payments: [], workOrders: [], users: [], denied: true };
    }

    const department = await container.departments.findBySlug(data.departmentSlug);
    if (!department) {
      return { department: null, conversations: [], payments: [], workOrders: [], users: [], denied: false };
    }

    if (!userBelongsToDepartment(user, department.id)) {
      return { department: null, conversations: [], payments: [], workOrders: [], users: [], denied: true };
    }

    const conversations = (
      await container.useCases.listConversations.execute({ departmentId: department.id })
    ).map(toConversationDto);

    const ids = new Set(conversations.map((c) => c.id));
    return {
      department: toDepartmentDto(department),
      conversations,
      payments: SEED_PAYMENTS.filter((p) => ids.has(p.conversationId)),
      workOrders: SEED_WORK_ORDERS.filter((w) => ids.has(w.conversationId)),
      users: (await container.useCases.listUsers.execute())
        .filter((u) => u.memberships.some((m) => m.departmentId === department.id))
        .map(toUserDto),
      denied: false,
    };
  });

export const getDashboardFn = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const container = getContainer();
    const conversations = (
      await container.useCases.listInboxForUser.execute(asUserId(data.userId))
    ).map(toConversationDto);
    const audit = (await container.audit.listRecent(8)).map(toAuditDto);
    const allDepartments = (await container.useCases.listDepartments.execute()).map(
      toDepartmentDto,
    );
    const user = await container.users.findById(asUserId(data.userId));

    const allowedDeptIds = user
      ? isGlobalAdmin(user)
        ? new Set(allDepartments.map((d) => d.id))
        : new Set(userDepartmentIds(user))
      : new Set<string>();

    const departments = allDepartments.filter((d) => allowedDeptIds.has(d.id));
    const users = (await container.useCases.listUsers.execute())
      .filter(
        (u) =>
          isGlobalAdmin(u) ||
          u.memberships.some((m) => allowedDeptIds.has(m.departmentId)) ||
          u.id === data.userId,
      )
      .map(toUserDto);

    const open = conversations.filter((c) => c.status === "open" || c.status === "pending");
    const ai = conversations.filter((c) => c.handlerMode === "ai").length;
    const human = conversations.filter((c) => c.handlerMode === "human").length;

    return {
      kpis: {
        conversations: conversations.length,
        open: open.length,
        aiPercent: conversations.length
          ? Math.round((ai / conversations.length) * 1000) / 10
          : 0,
        human,
        departments: departments.length,
        agents: users.length,
      },
      conversations: open.slice(0, 8),
      audit,
      departments,
      users,
      byDepartment: departments.map((d) => ({
        ...d,
        count: conversations.filter((c) => c.departmentId === d.id).length,
      })),
    };
  });

/** Simula un mensaje entrante de WhatsApp hacia el departamento del usuario. */
export const simulateInboundMessageFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().min(1),
      body: z.string().min(1),
      waPhone: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const user = await container.users.findById(asUserId(data.userId));
    if (!user) throw new Error("NOT_FOUND: User");

    const primary =
      (await container.departments.findById(user.primaryDepartmentId)) ??
      (await container.useCases.listDepartments.execute())[0];

    if (!primary) throw new Error("VALIDATION: No department available");

    const result = await container.useCases.receiveInboundMessage.execute({
      waPhone: data.waPhone ?? `+57 3${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`,
      body: data.body,
      departmentSlug: primary.slug,
      customerName: "Cliente WhatsApp",
      intent: primary.slug === "cartera" ? "pago" : "dano",
    });

    return {
      conversation: toConversationDto(result.conversation),
      message: toMessageDto(result.message),
      created: result.created,
    };
  });

export const getWhatsAppCloudStatusFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const configured = isWhatsAppCloudConfigured();
    const config = getWhatsAppCloudConfig();
    return {
      configured,
      phoneNumberId: config
        ? `${config.phoneNumberId.slice(0, 4)}…${config.phoneNumberId.slice(-4)}`
        : null,
      graphVersion: config?.graphVersion ?? null,
      defaultDepartmentSlug: config?.defaultDepartmentSlug ?? null,
      webhookPath: "/api/webhooks/whatsapp",
      hasAppSecret: Boolean(config?.appSecret),
    };
  },
);

export const sendWhatsAppReplyFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      conversationId: z.string().min(1),
      agentUserId: z.string().min(1),
      body: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const result = await getContainer().useCases.sendOutboundReply.execute({
        conversationId: asConversationId(data.conversationId),
        agentUserId: asUserId(data.agentUserId),
        body: data.body,
      });
      return {
        conversation: toConversationDto(result.conversation),
        message: toMessageDto(result.message),
        externalId: result.externalId,
      };
    } catch (error) {
      rethrowDomain(error);
    }
  });
