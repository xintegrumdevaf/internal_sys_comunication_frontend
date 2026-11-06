export type DepartmentBreakdownItem = {
  departmentId: string | null;
  departmentName?: string;
  activeCases: number;
  queueCases?: number;
  handledCases?: number;
};

/** Forma real de GetDashboardUseCase (backend) — contrato de docs/spec/03_API_CONTRACT.md. */
export type DashboardDto = {
  userId: string;
  role?: "agent" | "manager" | "admin";
  openConversations: number;
  myAssignedCases: number;
  escalatedPending: number;
  waitingUser: number;
  unattendedCases?: number;
  departmentCases?: number;
  unassignedQueue?: number;
  teamLoad?: Array<{ agentId: string; agentName: string; activeCases: number }>;
  departmentBreakdown?: DepartmentBreakdownItem[];
};
