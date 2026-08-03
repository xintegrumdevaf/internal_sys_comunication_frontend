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

export type AuditEventDto = {
  id: string;
  action: string;
  actorUserId?: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};
