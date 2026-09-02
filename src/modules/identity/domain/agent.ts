/** Entidad Agent real del backend (isp-customer-service-api). */
export type AgentRole = "agent" | "manager" | "admin";

export type AgentDto = {
  id: string; // UUID real, usado como agentUserId / header x-agent-id
  name: string;
  email: string;
  role: AgentRole;
  primaryDepartmentId: string | null;
  /** Departamentos a los que pertenece el agente (multidepartamento). */
  departmentIds: string[];
  active: boolean;
  /** Opt-in al pool de auto-asignación de su área principal. Default false. */
  autoAssignEnabled: boolean;
  /** Requiere cambio obligatorio de contraseña en el próximo inicio de sesión. */
  mustChangePassword: boolean;
  createdAt: string;
};
