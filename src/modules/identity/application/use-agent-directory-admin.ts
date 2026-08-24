import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as agentDirectoryGateway from "@/modules/identity/infrastructure/agent-directory.gateway";
import type {
  CreateAgentPayload,
  UpdateAgentPayload,
} from "@/modules/identity/infrastructure/agent-directory.gateway";

/**
 * Alta/edición/baja/reinicio de contraseña de agentes
 * (docs/spec/06_BACKEND_GAPS.md §1 y §1.b, resueltos). La identidad de quien
 * ejecuta la acción ya no se pasa a mano: el backend la lee de la sesión
 * real (cookie); solo un admin logueado puede llamar a estos endpoints.
 */
export function useAgentDirectoryAdmin() {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function run(label: string, action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `No se pudo ${label}`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** Devuelve la contraseña temporal generada, o null si falló. */
  async function runForTemporaryPassword(
    label: string,
    action: () => Promise<{ temporaryPassword: string }>,
    successMessage: string,
  ): Promise<string | null> {
    setBusy(true);
    try {
      const { temporaryPassword } = await action();
      toast.success(successMessage);
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      return temporaryPassword;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `No se pudo ${label}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  const createAgent = (payload: CreateAgentPayload) =>
    runForTemporaryPassword(
      "crear el agente",
      () => agentDirectoryGateway.createAgent(payload),
      "Agente creado",
    );

  const updateAgent = (agentId: string, payload: UpdateAgentPayload) =>
    run(
      "actualizar el agente",
      () => agentDirectoryGateway.updateAgent(agentId, payload),
      "Agente actualizado",
    );

  const setAutoAssign = (agentId: string, enabled: boolean) =>
    run(
      "actualizar la asignación automática",
      () => agentDirectoryGateway.updateAgent(agentId, { autoAssignEnabled: enabled }),
      enabled ? "Asignación automática activada" : "Asignación automática desactivada",
    );

  const deactivateAgent = (agentId: string) =>
    run(
      "desactivar el agente",
      () => agentDirectoryGateway.deactivateAgent(agentId),
      "Agente desactivado",
    );

  const reactivateAgent = (agentId: string) =>
    run(
      "reactivar el agente",
      () => agentDirectoryGateway.updateAgent(agentId, { active: true }),
      "Agente reactivado",
    );

  const resetPassword = (agentId: string) =>
    runForTemporaryPassword(
      "restablecer la contraseña",
      () => agentDirectoryGateway.resetAgentPassword(agentId),
      "Contraseña restablecida",
    );

  return {
    busy,
    createAgent,
    updateAgent,
    setAutoAssign,
    deactivateAgent,
    reactivateAgent,
    resetPassword,
  };
}
