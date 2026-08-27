import {
  Lock,
  KeyRound,
  ShieldCheck,
  Search,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
  Globe,
  Terminal,
  Activity,
  Filter,
  User,
  Bot,
  Laptop,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { StatCard } from "@/app/shell/AppShell";
import { StateDiffViewer } from "@/modules/audit/ui/StateDiffViewer";
import { auditApi } from "@/services/auditApi";
import type {
  AuditEvent,
  AuditStats,
  AuditCategory,
  AuditFilterParams,
} from "@/types/audit";
import {
  auditActionLabel,
  auditCategoryLabel,
} from "@/modules/audit/domain/audit-event";
import { useDepartmentsQuery } from "@/modules/identity/application/use-session";
import { relativeTime } from "@/shared/datetime";
import { toast } from "sonner";

const categoryStyles: Record<
  AuditCategory,
  { badge: string; dot: string; label: string }
> = {
  security: {
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/30",
    dot: "bg-red-500",
    label: "Seguridad",
  },
  operational: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30",
    dot: "bg-blue-500",
    label: "Operacional",
  },
  data_change: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30",
    dot: "bg-amber-500",
    label: "Cambio de Datos",
  },
  system: {
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30",
    dot: "bg-purple-500",
    label: "Sistema",
  },
};

export function AuditLogView() {
  const { data: departments = [] } = useDepartmentsQuery();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | "ALL">("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchEvents = async (cursor?: string, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const params: AuditFilterParams = {
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        departmentId: selectedDepartment || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: search.trim() || undefined,
        limit: 30,
        cursor: cursor || undefined,
      };

      const [eventsRes, statsRes] = await Promise.all([
        auditApi.listEvents(params),
        !append ? auditApi.getStats({ from: fromDate || undefined, to: toDate || undefined, departmentId: selectedDepartment || undefined }) : Promise.resolve(null),
      ]);

      if (append) {
        setEvents((prev) => [...prev, ...eventsRes.data]);
      } else {
        setEvents(eventsRes.data);
      }

      setNextCursor(eventsRes.nextCursor);
      if (statsRes) setStats(statsRes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar auditoría");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedDepartment, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchEvents();
  };

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    void fetchEvents(nextCursor, true);
  };

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner Informativo */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex items-start gap-3.5 shadow-xs">
        <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Sistema de Auditoría Empresarial y Forense</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Registro inmutable de trazabilidad completa con análisis de seguridad, cambios de estado estructurados (diffs), origen de red y correlación de eventos del sistema.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Eventos"
          value={stats ? String(stats.totalEvents) : String(events.length)}
          hint="Registro histórico de actividad"
        />
        <StatCard
          label="Seguridad"
          value={stats ? String(stats.byCategory?.security ?? 0) : "0"}
          tone="danger"
          hint="Inicios de sesión y credenciales"
        />
        <StatCard
          label="Operacionales"
          value={stats ? String(stats.byCategory?.operational ?? 0) : "0"}
          tone="success"
          hint="Atención, transferencias y reclamos"
        />
        <StatCard
          label="Cambios de Datos"
          value={stats ? String(stats.byCategory?.data_change ?? 0) : "0"}
          tone="warning"
          hint="Modificaciones de agentes y áreas"
        />
      </section>

      {/* Barra de Filtros */}
      <section className="p-3.5 sm:p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por actor, email, acción o ID de recurso..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as AuditCategory | "ALL")}
            className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="security">Seguridad</option>
            <option value="operational">Operacional</option>
            <option value="data_change">Cambio de Datos</option>
            <option value="system">Sistema</option>
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todas las Áreas</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Desde:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Hasta:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold uppercase hover:bg-primary/90 transition-colors shadow-xs"
          >
            <RefreshCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Filtrar</span>
          </button>
        </form>
      </section>

      {/* Tabla Forense */}
      <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
        <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Eventos de Auditoría ({events.length})
            </h3>
          </div>
          {nextCursor && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-foreground/5 px-2.5 py-1 rounded-full">
              Paginación activa
            </span>
          )}
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left">
            <thead className="bg-background/80 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <tr>
                <th className="px-4 sm:px-6 py-3">Fecha y Hora</th>
                <th className="px-4 sm:px-6 py-3">Categoría</th>
                <th className="px-4 sm:px-6 py-3">Acción</th>
                <th className="px-4 sm:px-6 py-3">Actor</th>
                <th className="px-4 sm:px-6 py-3">Departamento</th>
                <th className="px-4 sm:px-6 py-3">Origen / IP</th>
                <th className="px-4 sm:px-6 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => {
                const isExpanded = expandedRowId === e.id;
                const catStyle = categoryStyles[e.category] ?? categoryStyles.system;
                const timestamp = e.occurredAt || e.createdAt;
                const hasDiff = Boolean(e.beforeState || e.afterState);
                const hasMeta = e.metadata && Object.keys(e.metadata).length > 0;

                return (
                  <tr
                    key={e.id}
                    className={`transition-colors ${
                      isExpanded ? "bg-primary/5" : "hover:bg-foreground/5"
                    }`}
                  >
                    <td colSpan={7} className="p-0">
                      <div
                        onClick={() => toggleExpand(e.id)}
                        className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 cursor-pointer select-none"
                      >
                        {/* Fecha */}
                        <div className="w-36 shrink-0">
                          <p className="font-mono text-xs font-bold text-foreground">
                            {timestamp
                              ? new Date(timestamp).toLocaleTimeString("es-CO", { hour12: false })
                              : "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {timestamp ? relativeTime(timestamp) : "—"}
                          </p>
                        </div>

                        {/* Categoría */}
                        <div className="w-32 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${catStyle.badge}`}
                          >
                            <span className={`size-1.5 rounded-full ${catStyle.dot}`} />
                            {catStyle.label}
                          </span>
                        </div>

                        {/* Acción */}
                        <div className="w-56 shrink-0 min-w-0 pr-2">
                          <p className="font-bold text-xs text-foreground truncate">
                            {auditActionLabel(e.action)}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            {e.action}
                          </p>
                        </div>

                        {/* Actor */}
                        <div className="w-48 shrink-0 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-bold shrink-0">
                              {e.actor?.name ? e.actor.name.charAt(0).toUpperCase() : <User className="size-3" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate">
                                {e.actor?.name || "Sistema"}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {e.actor?.email || e.actor?.type || "system"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Departamento */}
                        <div className="w-32 shrink-0">
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {e.department?.name || "Global / N/A"}
                          </span>
                        </div>

                        {/* Red / IP */}
                        <div className="w-36 shrink-0">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                            <Globe className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{e.ipAddress || "Interna / Local"}</span>
                          </div>
                        </div>

                        {/* Botón Expansión */}
                        <div className="shrink-0 flex items-center justify-end">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-foreground/5 transition-colors"
                            aria-label="Ver detalles forenses"
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4 text-primary" />
                            ) : (
                              <ChevronDown className="size-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Panel Expandido de Detalles Forenses */}
                      {isExpanded && (
                        <div className="px-4 sm:px-6 py-4 bg-background/90 border-t border-border space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="p-3 rounded-lg border border-border bg-card">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                Identificadores
                              </span>
                              <p className="text-foreground text-[11px]">
                                Recurso: <span className="font-bold">{e.resourceType}</span> / {e.resourceId}
                              </p>
                              {e.correlationId && (
                                <p className="text-muted-foreground text-[10px] mt-1 truncate">
                                  Correlation: {e.correlationId}
                                </p>
                              )}
                            </div>

                            <div className="p-3 rounded-lg border border-border bg-card">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                Trazabilidad de Actor
                              </span>
                              <p className="text-foreground text-[11px]">
                                Rol: <span className="font-bold">{e.actor?.role || "N/A"}</span> ({e.actor?.type})
                              </p>
                              <p className="text-muted-foreground text-[10px] mt-1 truncate">
                                ID: {e.actor?.id || "N/A"}
                              </p>
                            </div>

                            <div className="p-3 rounded-lg border border-border bg-card">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                Entorno de Red
                              </span>
                              <p className="text-foreground text-[11px] truncate">
                                IP: {e.ipAddress || "Local / System"}
                              </p>
                              <p className="text-muted-foreground text-[10px] mt-1 truncate" title={e.userAgent || ""}>
                                UA: {e.userAgent || "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Comparación de Estados (Diffs) */}
                          {hasDiff && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Database className="size-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  Cambios de Estado (State Diff)
                                </span>
                              </div>
                              <StateDiffViewer before={e.beforeState} after={e.afterState} />
                            </div>
                          )}

                          {/* Metadata adicional */}
                          {hasMeta && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Terminal className="size-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  Metadatos del Evento
                                </span>
                              </div>
                              <pre className="p-3 rounded-xl border border-border bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48">
                                {JSON.stringify(e.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No se encontraron eventos de auditoría con los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación / Cargar más */}
        {nextCursor && (
          <div className="p-4 border-t border-border bg-background/60 flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-card border border-border hover:bg-foreground/5 text-xs font-bold uppercase transition-colors disabled:opacity-50 shadow-xs"
            >
              {loadingMore ? <RefreshCcw className="size-3.5 animate-spin text-primary" /> : null}
              <span>Cargar más eventos</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
