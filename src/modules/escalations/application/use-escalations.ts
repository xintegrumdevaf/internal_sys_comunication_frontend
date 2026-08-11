import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listEscalations } from "@/modules/escalations/infrastructure/escalation.gateway";
import type { EscalationDto, EscalationStatus } from "@/modules/escalations/domain/escalation";
import { useCaseActions } from "@/modules/cases/application/use-case-actions";
import { useSession } from "@/modules/identity/application/use-session";
import { getCaseSummary, getCaseTimeline } from "@/modules/cases/infrastructure/case.gateway";
import type { CaseSummaryDto, CaseTimelineEntryDto } from "@/modules/cases/domain/case";

export function useEscalations() {
  const session = useSession();
  const [departmentId, setDepartmentId] = useState("");
  const [triage, setTriage] = useState(false);
  const [status, setStatus] = useState<EscalationStatus | "">("");
  const [escalations, setEscalations] = useState<EscalationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CaseSummaryDto | null>(null);
  const [timeline, setTimeline] = useState<CaseTimelineEntryDto[]>([]);
  const [summaryFor, setSummaryFor] = useState<EscalationDto | null>(null);

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
    busy: caseActions.busy,
    reload,
    summary,
    timeline,
    summaryFor,
    setSummaryFor,
    openSummary,
    claim: (escalation: EscalationDto) => caseActions.claim(escalation.caseId),
  };
}
