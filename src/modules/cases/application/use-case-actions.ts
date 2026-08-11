import { useState } from "react";
import { toast } from "sonner";
import * as caseGateway from "@/modules/cases/infrastructure/case.gateway";
import type { SessionUser } from "@/modules/identity/domain/session";

/**
 * Acciones de caso reutilizables (claim/assign/reassign/complete/cancel/
 * transfer/automation), consumidas por conversations, escalations y
 * assignment - evita triplicar esta logica (DRY, docs/skills/design-patterns-frontend.md).
 */
export function useCaseActions(session: SessionUser | null, onChanged?: () => void | Promise<void>) {
  const [busy, setBusy] = useState(false);

  async function run(label: string, action: () => Promise<unknown>, successMessage?: string) {
    setBusy(true);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await onChanged?.();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `No se pudo ${label}`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const claim = (caseId: string) => {
    if (!session) return Promise.resolve(false);
    return run("reclamar el caso", () => caseGateway.claimCase(caseId, session.id), "Caso reclamado");
  };

  const assign = (caseId: string, agentUserId: string, departmentId?: string | null) => {
    if (!session) return Promise.resolve(false);
    return run(
      "asignar",
      () => caseGateway.assignCase(caseId, agentUserId, session.id, departmentId),
      "Caso asignado",
    );
  };

  const reassign = (caseId: string, agentUserId: string, departmentId?: string | null) => {
    if (!session) return Promise.resolve(false);
    return run(
      "reasignar",
      () => caseGateway.reassignCase(caseId, agentUserId, session.id, departmentId),
      "Caso reasignado",
    );
  };

  const complete = (caseId: string, resolutionNote?: string) => {
    if (!session) return Promise.resolve(false);
    return run(
      "completar",
      () => caseGateway.completeCase(caseId, session.id, resolutionNote),
      "Caso completado",
    );
  };

  const cancel = (caseId: string, reason: string) => {
    if (!session) return Promise.resolve(false);
    return run("cancelar", () => caseGateway.cancelCase(caseId, reason, session.id), "Caso cancelado");
  };

  const transfer = (caseId: string, toDepartmentId: string, reason: string) => {
    if (!session) return Promise.resolve(false);
    return run(
      "transferir",
      () => caseGateway.transferCase(caseId, toDepartmentId, reason, session.id),
      "Caso transferido",
    );
  };

  const disableAutomation = (caseId: string, reason: string) => {
    if (!session) return Promise.resolve(false);
    return run(
      "desactivar la automatización",
      () => caseGateway.disableAutomation(caseId, reason, session.id),
      "Automatización desactivada",
    );
  };

  const reactivateAutomation = (caseId: string) => {
    if (!session) return Promise.resolve(false);
    return run(
      "reactivar la automatización",
      () => caseGateway.reactivateAutomation(caseId, session.id),
      "Automatización reactivada",
    );
  };

  return {
    busy,
    claim,
    assign,
    reassign,
    complete,
    cancel,
    transfer,
    disableAutomation,
    reactivateAutomation,
  };
}
