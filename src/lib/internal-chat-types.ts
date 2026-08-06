export type MentionType = "conversation" | "customer";

export type Mention = {
  type: MentionType;
  /** conversationId o contractId según type */
  targetId: string;
  label: string;
};

export type InternalThread = {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: string;
};

export type InternalMessage = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  mentions: Mention[];
  createdAt: string;
};

export type RecentMentionEntry = {
  id: string;
  messageId: string;
  threadId: string;
  mention: Mention;
  authorId: string;
  createdAt: string;
};

export type MentionTarget = {
  type: MentionType;
  targetId: string;
  label: string;
  customerName: string;
  contractId?: string;
  conversationId?: string;
  department?: string;
  status?: string;
  preview?: string;
};

export type InternalChatState = {
  threads: InternalThread[];
  messages: InternalMessage[];
};
