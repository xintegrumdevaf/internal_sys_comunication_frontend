/** Entidad Agent real del backend (isp-customer-service-api). */
export type AgentRole = "agent" | "manager" | "admin";

export type AgentDto = {
  id: string; // UUID real, usado como agentUserId / header x-agent-id
  name: string;
  email: string;
  role: AgentRole;
  primaryDepartmentId: string | null;
  active: boolean;
  createdAt: string;
};
