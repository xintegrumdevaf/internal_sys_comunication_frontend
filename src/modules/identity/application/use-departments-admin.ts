import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as agentDirectoryGateway from "@/modules/identity/infrastructure/agent-directory.gateway";
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "@/modules/identity/infrastructure/agent-directory.gateway";

/**
 * Alta/edición/baja de departamentos.
 */
export function useDepartmentsAdmin() {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function run(label: string, action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `No se pudo ${label}`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const createDepartment = (payload: CreateDepartmentPayload) =>
    run(
      "crear el departamento",
      () => agentDirectoryGateway.createDepartment(payload),
      "Departamento creado",
    );

  const updateDepartment = (departmentId: string, payload: UpdateDepartmentPayload) =>
    run(
      "actualizar el departamento",
      () => agentDirectoryGateway.updateDepartment(departmentId, payload),
      "Departamento actualizado",
    );

  const deactivateDepartment = (departmentId: string) =>
    run(
      "desactivar el departamento",
      () => agentDirectoryGateway.deactivateDepartment(departmentId),
      "Departamento desactivado",
    );

  const reactivateDepartment = (departmentId: string) =>
    run(
      "reactivar el departamento",
      () => agentDirectoryGateway.updateDepartment(departmentId, { active: true }),
      "Departamento reactivado",
    );

  return { busy, createDepartment, updateDepartment, deactivateDepartment, reactivateDepartment };
}
