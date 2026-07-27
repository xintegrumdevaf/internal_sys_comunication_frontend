import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getContainer } from "@/core/composition/container";
import {
  toAuditDto,
  toConversationDto,
  toDepartmentDto,
  toUserDto,
} from "@/adapters/http/dto";
import { asConversationId, asDepartmentId, asUserId } from "@/core/shared/domain/ids";
import { DomainError } from "@/core/shared/domain/errors";

function rethrowDomain(error: unknown): never {
  if (error instanceof DomainError) {
    throw new Error(`${error.code}: ${error.message}`);
  }
  throw error;
}

/** UI adapter → Core: list departments (config-driven nav). */
export const listDepartmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const items = await getContainer().useCases.listDepartments.execute();
  return items.map(toDepartmentDto);
});

export const listUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  const items = await getContainer().useCases.listUsers.execute();
  return items.map(toUserDto);
});

export const listConversationsFn = createServerFn({ method: "GET" })
  .validator(z.object({ departmentId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const items = await getContainer().useCases.listConversations.execute({
      departmentId: data?.departmentId ? asDepartmentId(data.departmentId) : undefined,
    });
    return items.map(toConversationDto);
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
