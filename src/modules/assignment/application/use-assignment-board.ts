import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import { conversationDisplayName } from "@/modules/conversations/domain/conversation";
import { getCase } from "@/modules/cases/infrastructure/case.gateway";
import { useCaseActions } from "@/modules/cases/application/use-case-actions";
import type { CaseDto } from "@/modules/cases/domain/case";
import {
  useDepartmentsQuery,
  useDirectoryUsers,
  useSession,
} from "@/modules/identity/application/use-session";

/**
 * Gestion/monitoreo de asignacion manual (docs/spec/04_ASSIGNMENT_MANAGEMENT.md).
 * El agregado de carga se calcula en el cliente combinando conversaciones + casos
 * reales (el backend no expone todavia un endpoint agregado - 06_BACKEND_GAPS.md §3).
 * El algoritmo de auto-asignacion NO esta implementado aqui (06_BACKEND_GAPS.md §2).
 */
export function useAssignmentBoard() {
  const session = useSession();
  const { data: departments = [] } = useDepartmentsQuery();
  const directory = useDirectoryUsers();
  const [departmentId, setDepartmentId] = useState("");
  const [cases, setCases] = useState<CaseDto[]>([]);
  const [customerNameByCaseId, setCustomerNameByCaseId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0]!.id);
    }
  }, [departments, departmentId]);

  const reload = async () => {
    if (!departmentId) return;
    setLoading(true);
    try {
      const conversations = await listConversations({ departmentId, status: "open" });
      const nameMap: Record<string, string> = {};
      for (const conv of conversations) {
        if (conv.activeCaseId) nameMap[conv.activeCaseId] = conversationDisplayName(conv);
      }
      const caseIds = conversations.map((c) => c.activeCaseId).filter((id): id is string => !!id);
      const uniqueIds = Array.from(new Set(caseIds)).slice(0, 200);
      const loaded = await Promise.all(uniqueIds.map((id) => getCase(id).catch(() => null)));
      setCases(loaded.filter((c): c is CaseDto => c !== null));
      setCustomerNameByCaseId(nameMap);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la carga del departamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const caseActions = useCaseActions(session, reload);

  const agentsInDept = useMemo(
    () => directory.filter((u) => u.active && u.primaryDepartmentId === departmentId),
    [directory, departmentId],
  );

  const workload = useMemo(
    () =>
      agentsInDept.map((agent) => ({
        agent,
        activeCases: cases.filter(
          (c) => c.assignedAgentId === agent.id && c.status === "HUMAN_ACTIVE",
        ).length,
        waitingUser: cases.filter(
          (c) => c.assignedAgentId === agent.id && c.status === "WAITING_USER",
        ).length,
      })),
    [agentsInDept, cases],
  );

  const unassigned = cases.filter(
    (c) => !c.assignedAgentId && (c.status === "ESCALATED" || c.status === "HUMAN_ACTIVE"),
  );
  const assigned = cases.filter(
    (c) => c.assignedAgentId && (c.status === "ESCALATED" || c.status === "HUMAN_ACTIVE"),
  );

  return {
    departments,
    departmentId,
    setDepartmentId,
    directory,
    agentsInDept,
    workload,
    unassigned,
    assigned,
    cases,
    customerNameByCaseId,
    loading,
    busy: caseActions.busy,
    reload,
    assignCase: (caseId: string, agentUserId: string) => caseActions.assign(caseId, agentUserId),
    reassignCase: (caseId: string, agentUserId: string) =>
      caseActions.reassign(caseId, agentUserId),
  };
}
