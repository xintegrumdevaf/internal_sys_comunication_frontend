import { Router, Request, Response } from "express";
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

export const apiRouter = Router();

function handleDomainError(error: unknown, res: Response) {
  if (error instanceof DomainError) {
    res.status(400).json({ error: error.code, message: error.message });
    return;
  }
  console.error("Unhandled API Error:", error);
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
}

// GET /api/departments
apiRouter.get("/departments", async (_req: Request, res: Response) => {
  try {
    const items = await getContainer().useCases.listDepartments.execute();
    res.json(items.map(toDepartmentDto));
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/users
apiRouter.get("/users", async (_req: Request, res: Response) => {
  try {
    const items = await getContainer().useCases.listUsers.execute();
    res.json(items.map(toUserDto));
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/conversations
apiRouter.get("/conversations", async (req: Request, res: Response) => {
  try {
    const container = getContainer();
    const departmentIdQuery = req.query.departmentId as string | undefined;
    const departmentSlugQuery = req.query.departmentSlug as string | undefined;
    const userIdQuery = req.query.userId as string | undefined;

    if (userIdQuery && !departmentSlugQuery && !departmentIdQuery) {
      const items = await container.useCases.listInboxForUser.execute(asUserId(userIdQuery));
      res.json(items.map(toConversationDto));
      return;
    }

    let departmentId = departmentIdQuery;
    if (!departmentId && departmentSlugQuery) {
      const dept = await container.departments.findBySlug(departmentSlugQuery);
      departmentId = dept?.id;
    }

    if (departmentId && userIdQuery) {
      const user = await container.users.findById(asUserId(userIdQuery));
      if (!user || !userBelongsToDepartment(user, asDepartmentId(departmentId))) {
        res.json([]);
        return;
      }
    }

    if (departmentId && !userIdQuery) {
      res.json([]);
      return;
    }

    const items = await container.useCases.listConversations.execute({
      departmentId: departmentId ? asDepartmentId(departmentId) : undefined,
    });
    res.json(items.map(toConversationDto));
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/conversations/:conversationId/messages
apiRouter.get("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const items = await getContainer().useCases.listMessages.execute(
      asConversationId(conversationId),
    );
    res.json(items.map(toMessageDto));
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/conversations/:conversationId/context
apiRouter.get("/conversations/:conversationId/context", async (req: Request, res: Response) => {
  try {
    const container = getContainer();
    const conversationId = req.params.conversationId as string;
    const conversation = await container.conversations.findById(
      asConversationId(conversationId),
    );
    if (!conversation) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }

    const department = (await container.departments.findById(conversation.departmentId)) ?? null;
    const customer = conversation.contractId
      ? SEED_CUSTOMERS[conversation.contractId] ?? null
      : null;
    const payment = SEED_PAYMENTS.find((p: { conversationId: string }) => p.conversationId === conversation.id) ?? null;
    const workOrder = SEED_WORK_ORDERS.find((w: { conversationId: string }) => w.conversationId === conversation.id) ?? null;

    res.json({
      conversation: toConversationDto(conversation),
      department: department ? toDepartmentDto(department) : null,
      customer,
      payment,
      workOrder,
      transferTargets: SEED_DEPARTMENTS.filter(
        (d: { active: boolean; id: string }) => d.active && d.id !== conversation.departmentId,
      ).map(toDepartmentDto),
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});

// POST /api/conversations/take-control
apiRouter.post("/conversations/take-control", async (req: Request, res: Response) => {
  try {
    const { conversationId, agentUserId } = req.body;
    if (!conversationId || !agentUserId) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const conversation = await getContainer().useCases.takeControl.execute({
      conversationId: asConversationId(conversationId),
      agentUserId: asUserId(agentUserId),
    });
    res.json(toConversationDto(conversation));
  } catch (err) {
    handleDomainError(err, res);
  }
});

// POST /api/conversations/transfer
apiRouter.post("/conversations/transfer", async (req: Request, res: Response) => {
  try {
    const { conversationId, toDepartmentSlug, requestedByUserId, reason } = req.body;
    if (!conversationId || !toDepartmentSlug || !requestedByUserId || !reason) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const result = await getContainer().useCases.transferConversation.execute({
      conversationId: asConversationId(conversationId),
      toDepartmentSlug,
      requestedByUserId: asUserId(requestedByUserId),
      reason,
    });
    res.json({
      conversation: toConversationDto(result.conversation),
      transferId: result.transfer.id,
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/audit
apiRouter.get("/audit", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const items = await getContainer().audit.listRecent(limit);
    res.json(items.map(toAuditDto));
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/departments/board
apiRouter.get("/departments/board", async (req: Request, res: Response) => {
  try {
    const departmentSlug = req.query.departmentSlug as string;
    const userId = req.query.userId as string;

    if (!departmentSlug || !userId) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }

    const container = getContainer();
    const user = await container.users.findById(asUserId(userId));
    if (!user) {
      res.json({ department: null, conversations: [], payments: [], workOrders: [], users: [], denied: true });
      return;
    }

    const department = await container.departments.findBySlug(departmentSlug);
    if (!department) {
      res.json({ department: null, conversations: [], payments: [], workOrders: [], users: [], denied: false });
      return;
    }

    if (!userBelongsToDepartment(user, department.id)) {
      res.json({ department: null, conversations: [], payments: [], workOrders: [], users: [], denied: true });
      return;
    }

    const conversations = (
      await container.useCases.listConversations.execute({ departmentId: department.id })
    ).map(toConversationDto);

    const ids = new Set(conversations.map((c) => c.id));
    res.json({
      department: toDepartmentDto(department),
      conversations,
      payments: SEED_PAYMENTS.filter((p: { conversationId: string }) => ids.has(p.conversationId)),
      workOrders: SEED_WORK_ORDERS.filter((w: { conversationId: string }) => ids.has(w.conversationId)),
      users: (await container.useCases.listUsers.execute())
        .filter((u) => u.memberships.some((m) => m.departmentId === department.id))
        .map(toUserDto),
      denied: false,
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/dashboard
apiRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "missing_userId" });
      return;
    }

    const container = getContainer();
    const conversations = (
      await container.useCases.listInboxForUser.execute(asUserId(userId))
    ).map(toConversationDto);
    const audit = (await container.audit.listRecent(8)).map(toAuditDto);
    const allDepartments = (await container.useCases.listDepartments.execute()).map(
      toDepartmentDto,
    );
    const user = await container.users.findById(asUserId(userId));

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
          u.id === userId,
      )
      .map(toUserDto);

    const open = conversations.filter((c) => c.status === "open" || c.status === "pending");
    const ai = conversations.filter((c) => c.handlerMode === "ai").length;
    const human = conversations.filter((c) => c.handlerMode === "human").length;

    res.json({
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
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});

// POST /api/simulate-inbound
apiRouter.post("/simulate-inbound", async (req: Request, res: Response) => {
  try {
    const { userId, body, waPhone } = req.body;
    if (!userId || !body) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }

    const container = getContainer();
    const user = await container.users.findById(asUserId(userId));
    if (!user) {
      res.status(404).json({ error: "user_not_found" });
      return;
    }

    const primary =
      (await container.departments.findById(user.primaryDepartmentId)) ??
      (await container.useCases.listDepartments.execute())[0];

    if (!primary) {
      res.status(400).json({ error: "no_department_available" });
      return;
    }

    const result = await container.useCases.receiveInboundMessage.execute({
      waPhone: waPhone ?? `+57 3${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`,
      body,
      departmentSlug: primary.slug,
      customerName: "Cliente WhatsApp",
      intent: primary.slug === "cartera" ? "pago" : "dano",
    });

    res.json({
      conversation: toConversationDto(result.conversation),
      message: toMessageDto(result.message),
      created: result.created,
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});

// GET /api/whatsapp/status
apiRouter.get("/whatsapp/status", async (_req: Request, res: Response) => {
  try {
    const configured = isWhatsAppCloudConfigured();
    const config = getWhatsAppCloudConfig();
    res.json({
      configured,
      phoneNumberId: config
        ? `${config.phoneNumberId.slice(0, 4)}…${config.phoneNumberId.slice(-4)}`
        : null,
      graphVersion: config?.graphVersion ?? null,
      defaultDepartmentSlug: config?.defaultDepartmentSlug ?? null,
      webhookPath: "/api/webhooks/whatsapp",
      hasAppSecret: Boolean(config?.appSecret),
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});

// POST /api/whatsapp/reply
apiRouter.post("/whatsapp/reply", async (req: Request, res: Response) => {
  try {
    const { conversationId, agentUserId, body } = req.body;
    if (!conversationId || !agentUserId || !body) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const result = await getContainer().useCases.sendOutboundReply.execute({
      conversationId: asConversationId(conversationId),
      agentUserId: asUserId(agentUserId),
      body,
    });
    res.json({
      conversation: toConversationDto(result.conversation),
      message: toMessageDto(result.message),
      externalId: result.externalId,
    });
  } catch (err) {
    handleDomainError(err, res);
  }
});
