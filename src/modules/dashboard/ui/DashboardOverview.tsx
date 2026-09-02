import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Activity,
  Bot,
  AlertCircle,
  Timer,
  Building2,
  GitFork,
  Users,
  MessageSquare,
  ArrowRight,
  Inbox,
  Clock,
  UserCheck,
  Zap,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  useSession,
  useDepartmentsQuery,
  useAgentsQuery,
} from "@/modules/identity/application/use-session";
import { getDashboard } from "@/modules/dashboard/infrastructure/dashboard.gateway";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import type { DashboardDto } from "@/modules/dashboard/domain/dashboard";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import { conversationDisplayName } from "@/modules/conversations/domain/conversation";
import { relativeTime } from "@/shared/datetime";
import {
  useAnalyticsOverview,
  useCasesDistribution,
  useInfrastructureAlerts,
} from "@/modules/analytics/application/use-analytics";
import { calculatePresetDates } from "@/modules/analytics/domain/analytics.types";
import { formatWorkflow } from "@/modules/analytics/domain/analytics-translations";
import { InfrastructureAlertBanner } from "@/modules/analytics/ui/InfrastructureAlertBanner";

export function DashboardOverview() {
  const session = useSession();
  const isAdminOrSupervisor = session?.role === "admin" || session?.role === "manager";

  // Fechas del preset de hoy para las analíticas operativas
  const todayFilter = useMemo(() => calculatePresetDates("today"), []);

  // Queries de analíticas en tiempo real
  const overviewQuery = useAnalyticsOverview(todayFilter);
  const distributionQuery = useCasesDistribution(todayFilter);
  const alertsQuery = useInfrastructureAlerts(todayFilter);

  // Queries de directorio y departamentos
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: agents = [] } = useAgentsQuery();

  // Estados locales para datos operacionales rápidos
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);

  useEffect(() => {
    if (!session?.id) return;
    Promise.all([
      getDashboard(session.id).then(setDashboard),
      listConversations({ status: "open" }).then(setConversations),
    ]).catch((err) => console.error("Error cargando dashboard operativo:", err));
  }, [session?.id]);

  const overview = overviewQuery.data;
  const distribution = distributionQuery.data;
  const alerts = alertsQuery.data ?? [];

  // Mapeo de casos activos por departamento
  const deptCasesMap = useMemo(() => {
    const map = new Map<string, number>();
    const byDept = (
      distribution as unknown as { byDepartment?: Array<{ departmentId?: string; count: number }> }
    )?.byDepartment;
    if (byDept) {
      for (const d of byDept) {
        if (d.departmentId) map.set(d.departmentId, d.count);
      }
    }
    return map;
  }, [distribution]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner de Bienvenida y Accesos Rápidos */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0 shadow-xs ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                ¡Hola, {session?.name}!
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                {session?.roleLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAdminOrSupervisor
                ? "Centro de mando operativo. Monitoreo en tiempo real de flujos, IA y equipos."
                : "Resumen operativo de tu bandeja y casos asignados en tiempo real."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdminOrSupervisor && (
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-xs"
            >
              <TrendingUp className="size-3.5 text-primary" />
              <span>Analíticas detalladas</span>
            </Link>
          )}
          <Link
            to="/bandeja"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xs"
          >
            <Inbox className="size-3.5" />
            <span>Ir a Bandeja</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Banner de Alertas de Red / Infraestructura (si hay cortes o anomalías) */}
      {isAdminOrSupervisor && alerts.length > 0 && <InfrastructureAlertBanner alerts={alerts} />}

      {/* --- VISTA PARA ADMIN Y SUPERVISOR --- */}
      {isAdminOrSupervisor ? (
        <>
          {/* Indicadores Clave del Día (Macro KPIs Operativos) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="size-3.5 text-primary" /> Pulso Operativo del Día
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">
                Actualizado en vivo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Casos Activos Totales */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Casos Activos Totales
                  </span>
                  <Activity className="size-4 text-cyan-500" />
                </div>
                <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                  {overviewQuery.isLoading ? "—" : (overview?.activeCases ?? 0)}
                </p>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  En cola o atención viva ahora
                </p>
              </div>

              {/* Contención IA */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Contención IA
                  </span>
                  <Bot className="size-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-extrabold font-mono text-foreground">
                    {overviewQuery.isLoading ? "—" : `${overview?.botContainmentRate ?? 0}%`}
                  </p>
                  {((overview as unknown as { botCompletedCases?: number })?.botCompletedCases ??
                    0) > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      ({(overview as unknown as { botCompletedCases?: number })?.botCompletedCases}{" "}
                      resueltos)
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  Resueltos sin intervención humana
                </p>
              </div>

              {/* Escalaciones a Humano */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Casos Escalados
                  </span>
                  <AlertCircle className="size-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-extrabold font-mono text-foreground">
                    {overviewQuery.isLoading
                      ? "—"
                      : ((overview as unknown as { escalatedCases?: number })?.escalatedCases ?? 0)}
                  </p>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono">
                    ({overview?.escalationRate ?? 0}%)
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-muted-foreground">Derivados al equipo humano</p>
              </div>

              {/* Espera en Cola */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Espera Media en Cola
                  </span>
                  <Timer className="size-4 text-amber-500" />
                </div>
                <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                  {overviewQuery.isLoading
                    ? "—"
                    : (() => {
                        const waitSec =
                          overview?.avgQueueWaitTimeSeconds ??
                          (overview as unknown as { avgQueueWaitSec?: number })?.avgQueueWaitSec;
                        return waitSec != null && waitSec > 0
                          ? `${Math.round(waitSec)} seg`
                          : "0 seg";
                      })()}
                </p>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  Resolución media:{" "}
                  {(
                    overview?.avgResolutionTimeMinutes ??
                    (overview as unknown as { avgResolutionMinutes?: number })
                      ?.avgResolutionMinutes ??
                    0
                  ).toFixed(1)}{" "}
                  min
                </p>
              </div>
            </div>
          </section>

          {/* Grilla Central: Carga por Departamento y Distribución de Flujos */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Carga por Departamento en Vivo */}
            <div className="col-span-1 lg:col-span-6 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Building2 className="size-4 text-primary" /> Carga por Departamento
                  </h3>
                  <Link
                    to="/escalaciones"
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Ver colas</span>
                    <ChevronRight className="size-3" />
                  </Link>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Volumen de casos activos y estado de atención en cada área operativa.
                </p>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {departments.map((d) => {
                    const count = deptCasesMap.get(d.id) ?? 0;
                    const isHighLoad = count >= 5;
                    const isModerate = count > 0 && count < 5;

                    return (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {d.slug.toUpperCase()} • {d.visibility}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                              isHighLoad
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30"
                                : isModerate
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {count} {count === 1 ? "caso" : "casos"}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {departments.length === 0 && (
                    <p className="p-4 text-xs text-center text-muted-foreground">
                      No hay departamentos registrados.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Distribución por Tipo de Flujo del Día */}
            <div className="col-span-1 lg:col-span-6 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <GitFork className="size-4 text-primary" /> Casos por Tipo de Flujo (Hoy)
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    Total: {distribution?.totalCases ?? 0}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Distribución de incidentes atendidos por el asistente y derivados según
                  tipificación.
                </p>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {distribution?.byWorkflow.map((item, idx) => {
                    const formatted = formatWorkflow(item.workflowType);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground truncate max-w-[70%]">
                            {formatted}
                            <span className="ml-1.5 text-[10px] text-muted-foreground font-mono font-normal">
                              ({item.workflowType})
                            </span>
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-muted-foreground">{item.count} casos</span>
                            <span className="font-bold text-primary">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {(!distribution?.byWorkflow || distribution.byWorkflow.length === 0) && (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Sin flujos activos registrados el día de hoy.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Grilla Inferior: Conversaciones en Vivo y Estado de Agentes */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conversaciones Abiertas en Vivo */}
            <div className="col-span-1 lg:col-span-7 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" /> Conversaciones en Atención Viva
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {conversations.length} activas
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-72 pr-1">
                {conversations.slice(0, 10).map((c) => (
                  <Link
                    key={c.id}
                    to="/bandeja"
                    className="p-3 hover:bg-muted/40 rounded-xl transition-colors flex items-center justify-between gap-3 group block"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {conversationDisplayName(c)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {relativeTime(c.lastActivityAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.lastMessagePreview?.body ?? "Sin mensajes aún"}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}

                {conversations.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No hay conversaciones activas en este momento.
                  </div>
                )}
              </div>
            </div>

            {/* Disponibilidad y Carga del Equipo */}
            <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Users className="size-4 text-primary" /> Disponibilidad del Equipo
                </h3>
                <Link
                  to="/usuarios"
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-72 pr-1">
                {agents.slice(0, 8).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/40 hover:bg-background transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0">
                        {a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {a.role.toUpperCase()} •{" "}
                          {(a as unknown as { departmentSlug?: string }).departmentSlug ??
                            "General"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        a.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.active ? "En línea" : "Desconectado"}
                    </span>
                  </div>
                ))}

                {agents.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Sin agentes registrados.
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* --- VISTA PARA AGENTE OPERATIVO --- */
        <>
          {/* Indicadores Personales Clave */}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-3.5 text-primary" /> Mis Indicadores Operativos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Casos Asignados */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Casos Asignados
                  </span>
                  <UserCheck className="size-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                  {dashboard?.myAssignedCases ?? 0}
                </p>
                <p className="text-[11px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  Bajo tu atención activa
                </p>
              </div>

              {/* Conversaciones Abiertas */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Conversaciones Abiertas
                  </span>
                  <MessageSquare className="size-4 text-primary" />
                </div>
                <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                  {dashboard?.openConversations ?? 0}
                </p>
                <p className="text-[11px] mt-1 text-muted-foreground">En curso con clientes</p>
              </div>

              {/* Esperando Cliente */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Esperando Cliente
                  </span>
                  <Clock className="size-4 text-sky-500" />
                </div>
                <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                  {dashboard?.waitingUser ?? 0}
                </p>
                <p className="text-[11px] mt-1 text-muted-foreground">Pendientes de respuesta</p>
              </div>

              {/* Escalados en Mi Departamento */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    En Cola de Mi Área
                  </span>
                  <Zap className="size-4 text-amber-500" />
                </div>
                <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
                  {dashboard?.escalatedPending ?? 0}
                </p>
                <p className="text-[11px] mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  Listos para atender o reclamar
                </p>
              </div>
            </div>
          </section>

          {/* Grilla de Agente: Mis Conversaciones y Cola de Trabajo */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mis Conversaciones Activas */}
            <div className="col-span-1 lg:col-span-7 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" /> Mis Conversaciones Activas
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {conversations.length} en bandeja
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-80 pr-1">
                {conversations.slice(0, 15).map((c) => (
                  <Link
                    key={c.id}
                    to="/bandeja"
                    className="p-3 hover:bg-muted/40 rounded-xl transition-colors flex items-center justify-between gap-3 group block"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {conversationDisplayName(c)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {relativeTime(c.lastActivityAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.lastMessagePreview?.body ?? "Sin mensajes"}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}

                {conversations.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No tienes conversaciones abiertas en este momento. ¡Estás al día!
                  </div>
                )}
              </div>
            </div>

            {/* Accesos Rápidos de Operación */}
            <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
                  <Zap className="size-4 text-primary" /> Acciones Rápidas
                </h3>

                <div className="space-y-3">
                  <Link
                    to="/bandeja"
                    className="p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-all flex items-center justify-between group block"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        Bandeja de Entrada
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Atiende a tus clientes asignados en tiempo real
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>

                  <Link
                    to="/escalaciones"
                    className="p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-all flex items-center justify-between group block"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        Casos Escalados del Área
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Reclama tickets pendientes de tu departamento
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                <p className="font-semibold text-primary mb-0.5">Consejo operativo</p>
                <p className="text-[11px]">
                  Recuerda cerrar los casos resueltos para mantener tus métricas de tiempo de
                  atención (AHT) y resolución optimizadas.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
