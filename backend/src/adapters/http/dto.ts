import { z } from "zod";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { Message } from "@/core/modules/conversations/domain/message";
import type { Department } from "@/core/modules/departments/domain/department";
import type { User } from "@/core/modules/identity/domain/user";
import type { AuditEvent } from "@/core/modules/auditing/domain/audit-event";

export const inboundMessageSchema = z.object({
  waPhone: z.string().min(5),
  body: z.string().min(1),
  departmentSlug: z.string().min(1),
  waMessageId: z.string().optional(),
  customerName: z.string().optional(),
  contractId: z.string().optional(),
  intent: z.string().optional(),
});

export type InboundMessageDto = z.infer<typeof inboundMessageSchema>;

/** n8n → Core automated WhatsApp reply */
export const n8nReplySchema = z
  .object({
    body: z.string().min(1),
    conversationId: z.string().min(1).optional(),
    waPhone: z.string().min(5).optional(),
    intent: z.string().optional(),
    departmentSlug: z.string().optional(),
  })
  .refine((data) => Boolean(data.conversationId || data.waPhone), {
    message: "conversationId or waPhone is required",
  });

export type N8nReplyDto = z.infer<typeof n8nReplySchema>;

export type ConversationDto = {
  id: string;
  waPhone: string;
  customerName?: string;
  contractId?: string;
  departmentId: string;
  status: string;
  handlerMode: string;
  assigneeId?: string;
  intent?: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  direction: string;
  author: string;
  body: string;
  createdAt: string;
  type?: string;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  mediaUrl?: string;
};

export type DepartmentDto = {
  id: string;
  slug: string;
  name: string;
  description: string;
  landingPath: string;
};

export type UserDto = {
  id: string;
  name: string;
  initials: string;
  email: string;
  primaryDepartmentId: string;
  memberships: Array<{ departmentId: string; role: string }>;
};

export function toConversationDto(c: Conversation): ConversationDto {
  return {
    id: c.id,
    waPhone: c.waPhone,
    customerName: c.customerName,
    contractId: c.contractId,
    departmentId: c.departmentId,
    status: c.status,
    handlerMode: c.handlerMode,
    assigneeId: c.assigneeId,
    intent: c.intent,
    lastMessagePreview: c.lastMessagePreview,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function toMessageDto(m: Message): MessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    direction: m.direction,
    author: m.author,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    type: m.type,
    mediaId: m.mediaId,
    mimeType: m.mimeType,
    caption: m.caption,
    filename: m.filename,
    mediaUrl: m.mediaUrl,
  };
}

export function toDepartmentDto(d: Department): DepartmentDto {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description,
    landingPath: d.landingPath,
  };
}

export function toUserDto(u: User): UserDto {
  return {
    id: u.id,
    name: u.name,
    initials: u.initials,
    email: u.email,
    primaryDepartmentId: u.primaryDepartmentId,
    memberships: u.memberships.map((m) => ({
      departmentId: m.departmentId,
      role: m.role,
    })),
  };
}

export type AuditEventDto = {
  id: string;
  action: string;
  actorUserId?: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export function toAuditDto(e: AuditEvent): AuditEventDto {
  const metadata = e.metadata
    ? (JSON.parse(JSON.stringify(e.metadata)) as Record<
        string,
        string | number | boolean | null
      >)
    : undefined;
  return {
    id: e.id,
    action: e.action,
    actorUserId: e.actorUserId,
    resourceType: e.resourceType,
    resourceId: e.resourceId,
    metadata,
    createdAt: e.createdAt.toISOString(),
  };
}
