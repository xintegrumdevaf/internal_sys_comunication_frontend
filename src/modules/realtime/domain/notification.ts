/** Notificacion in-app derivada de eventos SSE (docs/spec/03_REALTIME_NOTIFICATIONS.md §3). */
export type UiNotification = {
  id: string;
  kind: "CASE_ESCALATED" | "HUMAN_ASSIGNED";
  caseId: string;
  conversationId?: string;
  departmentId?: string | null;
  /** true si HUMAN_ASSIGNED me asigno el caso a mi. */
  isMine?: boolean;
  createdAt: string;
  read: boolean;
};
