import { apiGet, apiPost } from "@/lib/api-client";
import type {
  AuditEventDto,
  ConversationDto,
  CustomerDto,
  DashboardDto,
  DepartmentDto,
  MessageDto,
  UserDto,
} from "@/adapters/http/dto";
import type { PaymentCase, WorkOrder } from "@/lib/ops-types";
import { resolveApiUrl } from "@/lib/api-base";

type DataArg<T> = { data: T };
type OptionalDataArg<T> = { data?: T };

function withMediaUrls(messages: MessageDto[]): MessageDto[] {
  return messages.map((message) =>
    message.mediaUrl ? { ...message, mediaUrl: resolveApiUrl(message.mediaUrl) } : message,
  );
}

export async function listDepartmentsFn(): Promise<DepartmentDto[]> {
  return apiGet<DepartmentDto[]>("/api/departments");
}

export async function listUsersFn(): Promise<UserDto[]> {
  return apiGet<UserDto[]>("/api/users");
}

export async function listConversationsFn(
  arg?: OptionalDataArg<{
    departmentId?: string;
    departmentSlug?: string;
    userId?: string;
  }>,
): Promise<ConversationDto[]> {
  return apiGet<ConversationDto[]>("/api/conversations", arg?.data);
}

export async function listMessagesFn(
  arg: DataArg<{ conversationId: string }>,
): Promise<MessageDto[]> {
  const items = await apiGet<MessageDto[]>(
    `/api/conversations/${arg.data.conversationId}/messages`,
  );
  return withMediaUrls(items);
}

export async function getConversationContextFn(arg: DataArg<{ conversationId: string }>) {
  return apiGet<{
    conversation: ConversationDto;
    department: DepartmentDto | null;
    customer: CustomerDto | null;
    payment: PaymentCase | null;
    workOrder: WorkOrder | null;
    transferTargets: DepartmentDto[];
  }>(`/api/conversations/${arg.data.conversationId}/context`);
}

export async function takeControlFn(
  arg: DataArg<{ conversationId: string; agentUserId: string }>,
): Promise<ConversationDto> {
  return apiPost<ConversationDto>("/api/conversations/take-control", arg.data);
}

export async function transferConversationFn(
  arg: DataArg<{
    conversationId: string;
    toDepartmentSlug: string;
    requestedByUserId: string;
    reason: string;
  }>,
): Promise<{ conversation: ConversationDto; transferId: string }> {
  return apiPost("/api/conversations/transfer", arg.data);
}

export async function listAuditEventsFn(
  arg?: OptionalDataArg<{ limit?: number }>,
): Promise<AuditEventDto[]> {
  return apiGet<AuditEventDto[]>("/api/audit", { limit: arg?.data?.limit });
}

export async function getDepartmentBoardFn(
  arg: DataArg<{ departmentSlug: string; userId: string }>,
) {
  return apiGet<{
    department: DepartmentDto | null;
    conversations: ConversationDto[];
    payments: PaymentCase[];
    workOrders: WorkOrder[];
    users: UserDto[];
    denied: boolean;
  }>("/api/departments/board", arg.data);
}

export async function getDashboardFn(arg: DataArg<{ userId: string }>) {
  return apiGet<DashboardDto>("/api/dashboard", arg.data);
}

export async function simulateInboundMessageFn(
  arg: DataArg<{ userId: string; body: string; waPhone?: string }>,
) {
  return apiPost("/api/simulate-inbound", arg.data);
}

export async function getWhatsAppCloudStatusFn() {
  return apiGet<{
    configured: boolean;
    phoneNumberId: string | null;
    graphVersion: string | null;
    defaultDepartmentSlug: string | null;
    webhookPath: string;
    appPublicUrl: string | null;
    publicWebhookUrl: string | null;
    hasAppSecret: boolean;
  }>("/api/whatsapp/status");
}

export async function sendWhatsAppReplyFn(
  arg: DataArg<{
    conversationId: string;
    agentUserId: string;
    body: string;
  }>,
) {
  const result = await apiPost<{
    conversation: ConversationDto;
    message: MessageDto;
    externalId?: string;
  }>("/api/whatsapp/reply", arg.data);
  return {
    ...result,
    message: withMediaUrls([result.message])[0]!,
  };
}
