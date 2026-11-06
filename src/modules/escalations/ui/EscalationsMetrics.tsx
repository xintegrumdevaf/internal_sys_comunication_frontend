import { StatCard } from "@/app/shell/AppShell";
import { getEscalationSla, type EscalationDto } from "@/modules/escalations/domain/escalation";

export type EscalationsMetricsProps = {
  escalations: EscalationDto[];
};

function formatMaxWait(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export function EscalationsMetrics({ escalations }: EscalationsMetricsProps) {
  const pending = escalations.filter((e) => e.status === "PENDING");
  const pendingCount = pending.length;

  let breachedSlaCount = 0;
  let warningSlaCount = 0;
  let maxWaitMinutes = 0;

  for (const esc of pending) {
    const sla = getEscalationSla(esc.createdAt);
    if (sla.risk === "breached") breachedSlaCount++;
    if (sla.risk === "warning") warningSlaCount++;
    if (sla.minutesWaiting > maxWaitMinutes) {
      maxWaitMinutes = sla.minutesWaiting;
    }
  }

  const unclassifiedCount = escalations.filter((e) => e.departmentId === null).length;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Casos en Cola Humana"
        value={String(pendingCount)}
        tone={pendingCount > 0 ? "warning" : "default"}
        hint="Casos pendientes de atención"
      />
      <StatCard
        label="SLA Vencido (>15m)"
        value={String(breachedSlaCount)}
        tone={breachedSlaCount > 0 ? "danger" : "success"}
        hint={
          warningSlaCount > 0
            ? `${warningSlaCount} en riesgo (5-15 min)`
            : breachedSlaCount > 0
              ? "Requiere rescate inmediato"
              : "Todos los casos en tiempo SLA"
        }
      />
      <StatCard
        label="Mesa de Triaje (IA)"
        value={String(unclassifiedCount)}
        tone={unclassifiedCount > 0 ? "danger" : "default"}
        hint={
          unclassifiedCount > 0
            ? "Casos sin área que requieren triaje manual"
            : "No hay casos huérfanos"
        }
      />
      <StatCard
        label="Mayor Espera en Fila"
        value={formatMaxWait(maxWaitMinutes)}
        tone={maxWaitMinutes >= 15 ? "danger" : maxWaitMinutes >= 5 ? "warning" : "default"}
        hint="Tiempo del cliente más antiguo"
      />
    </section>
  );
}
