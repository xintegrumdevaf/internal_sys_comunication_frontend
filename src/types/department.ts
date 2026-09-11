export type DepartmentHandlingMode = "ai_assisted" | "human_direct";

export interface DepartmentCase {
  id?: string;
  departmentId?: string;
  label: string; // Ej: "Cancelación de Contrato"
  description: string; // Ej: "cuando el cliente pide cancelar el contrato o darse de baja"
  intentKey?: string; // Opcional: auto-generado por el backend
  handlingMode: DepartmentHandlingMode; // 'ai_assisted' | 'human_direct'
  workflowType?: string; // Opcional: por defecto 'GENERAL_INQUIRY'
  active?: boolean;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string | null; // Nuevo campo explicativo
  visibility: "shared" | "restricted";
  active: boolean;
  cases?: DepartmentCase[]; // Lista de casos/solicitudes que atiende
  createdAt?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  slug: string;
  description?: string;
  visibility?: "shared" | "restricted";
  cases?: Array<{
    label: string;
    description: string;
    handlingMode?: DepartmentHandlingMode;
    workflowType?: string;
  }>;
}

export interface UpdateDepartmentPayload {
  name?: string;
  slug?: string;
  description?: string;
  visibility?: "shared" | "restricted";
  active?: boolean;
  cases?: Array<{
    id?: string;
    label: string;
    description: string;
    handlingMode?: DepartmentHandlingMode;
    workflowType?: string;
    active?: boolean;
  }>;
}

export interface ZernioSyncStatus {
  status: "idle" | "running" | "completed" | "failed";
  totalMessagesSynced: number;
  startedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  progress?: number;
  totalItems?: number;
}
