import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  drainEscalationsQueue,
  listEscalations,
} from "@/modules/escalations/infrastructure/escalation.gateway";
import type { EscalationDto, EscalationStatus } from "@/modules/escalations/domain/escalation";
import { useCaseActions } from "@/modules/cases/application/use-case-actions";
import { useSession } from "@/modules/identity/application/use-session";
import { getCaseSummary, getCaseTimeline } from "@/modules/cases/infrastructure/case.gateway";
import type { CaseSummaryDto, CaseTimelineEntryDto } from "@/modules/cases/domain/case";

export function useEscalations(initialDepartmentId?: string) {
  const session = useSession();
  const [departmentId, setDepartmentId] = useState(initialDepartmentId ?? "");
  const [triage, setTriage] = useState(false);
  const [status, setStatus] = useState<EscalationStatus | "">("");
  const [escalations, setEscalations] = useState<EscalationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draining, setDraining] = useState(false);
  const [summary, setSummary] = useState<CaseSummaryDto | null>(null);
  const [timeline, setTimeline] = useState<CaseTimelineEntryDto[]>([]);
  const [summaryFor, setSummaryFor] = useState<EscalationDto | null>(null);

  useEffect(() => {
    if (initialDepartmentId !== undefined) {
      setDepartmentId(initialDepartmentId);
    }
  }, [initialDepartmentId]);

  const reload = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await listEscalations({
        agentUserId: session.id,
        departmentId: departmentId || undefined,
        status: status || undefined,
        triage,
      });
      setEscalations(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar escalaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, departmentId, status, triage]);

  const caseActions = useCaseActions(session, async () => {
    setSummaryFor(null);
    await reload();
  });

  const handleDrainQueue = async () => {
    if (draining) return;
    setDraining(true);
    try {
      const res = await drainEscalationsQueue(departmentId || undefined);
      if (res.drainedCount > 0) {
        toast.success(
          `Se auto-distribuyeron ${res.drainedCount} casos a los asesores disponibles.`,
        );
      } else {
        toast.info("No hay casos pendientes o los asesores en turno están a capacidad máxima.");
      }
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al vaciar cola de escalaciones");
    } finally {
      setDraining(false);
    }
  };

  const openSummary = async (escalation: EscalationDto) => {
    setSummaryFor(escalation);
    setSummary(null);
    setTimeline([]);
    try {
      const [s, t] = await Promise.all([
        getCaseSummary(escalation.caseId),
        getCaseTimeline(escalation.caseId),
      ]);
      setSummary(s);
      setTimeline(t);
    } catch {
      setSummary(escalation.summary);
    }
  };

  return {
    session,
    departmentId,
    setDepartmentId,
    triage,
    setTriage,
    status,
    setStatus,
    escalations,
    loading,
    draining,
    busy: caseActions.busy,
    reload,
    drainQueue: handleDrainQueue,
    summary,
    timeline,
    summaryFor,
    setSummaryFor,
    openSummary,
    claim: (escalation: EscalationDto) => caseActions.claim(escalation.caseId),
  };
}
