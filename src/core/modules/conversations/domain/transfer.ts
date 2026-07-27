import type {
  ConversationId,
  DepartmentId,
  TransferId,
  UserId,
} from "@/core/shared/domain/ids";

export type Transfer = {
  id: TransferId;
  conversationId: ConversationId;
  fromDepartmentId: DepartmentId;
  toDepartmentId: DepartmentId;
  requestedByUserId: UserId;
  reason: string;
  createdAt: Date;
};

export function createTransfer(input: {
  id: TransferId;
  conversationId: ConversationId;
  fromDepartmentId: DepartmentId;
  toDepartmentId: DepartmentId;
  requestedByUserId: UserId;
  reason: string;
}): Transfer {
  return {
    ...input,
    createdAt: new Date(),
  };
}
