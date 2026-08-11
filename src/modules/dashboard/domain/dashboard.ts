/** Forma real de GetDashboardUseCase (backend) — mas simple que el mock anterior. */
export type DashboardDto = {
  userId: string;
  openConversations: number;
  myAssignedCases: number;
  escalatedPending: number;
  waitingUser: number;
};
