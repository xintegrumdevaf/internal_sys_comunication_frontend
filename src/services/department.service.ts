import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/http/http-client";
import type {
  CreateDepartmentPayload,
  Department,
  DepartmentCase,
  UpdateDepartmentPayload,
} from "@/types/department";

export const departmentService = {
  // Obtiene todos los departamentos (ahora incluye sus cases asociados)
  getDepartments: async (): Promise<Department[]> => {
    return apiGet<Department[]>("/api/departments");
  },

  // Crear departamento con casos
  createDepartment: async (payload: CreateDepartmentPayload): Promise<Department> => {
    return apiPost<Department>("/api/departments", payload);
  },

  // Actualizar departamento y sus casos
  updateDepartment: async (id: string, payload: UpdateDepartmentPayload): Promise<Department> => {
    return apiPut<Department>(`/api/departments/${id}`, payload);
  },

  // Operaciones granulares de casos
  getDepartmentCases: async (departmentId: string): Promise<DepartmentCase[]> => {
    return apiGet<DepartmentCase[]>(`/api/departments/${departmentId}/cases`);
  },

  addDepartmentCase: async (
    departmentId: string,
    caseData: Partial<DepartmentCase>,
  ): Promise<DepartmentCase> => {
    return apiPost<DepartmentCase>(`/api/departments/${departmentId}/cases`, caseData);
  },

  deleteDepartmentCase: async (caseId: string): Promise<void> => {
    await apiDelete<void>(`/api/departments/cases/${caseId}`);
  },
};
