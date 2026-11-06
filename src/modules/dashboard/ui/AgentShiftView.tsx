import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  Inbox,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import type { SessionUser } from "@/modules/identity/domain/session";
import type { DashboardDto } from "@/modules/dashboard/domain/dashboard";
import {
  conversationDisplayName,
  type ConversationDto,
} from "@/modules/conversations/domain/conversation";
import type { AgentPerformanceDto } from "@/modules/analytics/domain/analytics.types";
import { relativeTime } from "@/shared/datetime";

interface AgentShiftViewProps {
  session: SessionUser;
  dashboard: DashboardDto | null;
  myPerformance?: AgentPerformanceDto | null;
  conversations: ConversationDto[];
  isLoading?: boolean;
}

export function AgentShiftView({
  session,
  dashboard,
  myPerformance,
  conversations,
  isLoading,
}: AgentShiftViewProps) {
  const maxCapacity = myPerformance?.maxCapacityThreshold || 6;
  const activeCases = dashboard?.myAssignedCases ?? myPerformance?.activeCasesNow ?? 0;
  const closedToday = myPerformance?.casesCompleted ?? 0;
  const occupancyPct = Math.min(Math.round((activeCases / maxCapacity) * 100), 100);
  const isFull = activeCases >= maxCapacity;

  const formatFrt = (ms?: number | null) => {
    if (ms == null || ms <= 0) return "—";
    if (ms < 60000) return `${Math.round(ms / 1000)} seg`;
    return `${(ms / 60000).toFixed(1)} min`;
  };

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida del Asesor */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0 shadow-xs ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                Hola, {session.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                En Turno
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Panel de control personal: revisa tu carga viva y atiende a tus clientes asignados.
            </p>
          </div>
        </div>

        <Link
          to="/bandeja"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xs shrink-0"
        >
          <Inbox className="size-3.5" />
          <span>Abrir Mi Bandeja</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* 4 Indicadores Personales Clave */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Mi Ocupación Viva */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${isFull ? "bg-rose-500" : "bg-emerald-500"}`}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Mi Carga Activa
            </span>
            <div
              className={`size-8 rounded-lg grid place-items-center ${isFull ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}
            >
              <Gauge className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2 font-mono">
            <p className="text-3xl font-extrabold text-foreground">{activeCases}</p>
            <span className="text-xs text-muted-foreground">
              / {maxCapacity} cupos ({occupancyPct}%)
            </span>
          </div>
          <p
            className={`text-[11px] mt-1 font-medium ${isFull ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            {isFull ? "Capacidad máxima alcanzada" : "Disponible para recibir casos"}
          </p>
        </div>

        {/* 2. Casos Resueltos Hoy */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Casos Cerrados Hoy
            </span>
            <div className="size-8 rounded-lg bg-cyan-500/10 text-cyan-600 grid place-items-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">{closedToday}</p>
          <p className="text-[11px] mt-1 text-muted-foreground font-medium">
            Resueltos en tu turno
          </p>
        </div>

        {/* 3. Mi Tiempo de Respuesta (FRT) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Primera Respuesta Media
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
            {formatFrt(myPerformance?.avgFirstResponseTimeMs)}
          </p>
          <p className="text-[11px] mt-1 text-muted-foreground">Velocidad inicial al cliente</p>
        </div>

        {/* 4. En Cola en Mi Área */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              En Cola de Mi Área
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 grid place-items-center">
              <Zap className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
            {dashboard?.escalatedPending ?? 0}
          </p>
          <p className="text-[11px] mt-1 text-amber-600 dark:text-amber-400 font-medium">
            {dashboard?.escalatedPending ? "Casos listos para asignar" : "Sin clientes en espera"}
          </p>
        </div>
      </section>

      {/* Grilla Inferior: Mis Chats y Acciones */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mis Conversaciones Activas */}
        <div className="col-span-1 lg:col-span-8 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" /> Mis Conversaciones Asignadas
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {conversations.length} activas
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-80 pr-1">
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

            {conversations.length === 0 && !isLoading && (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No tienes conversaciones activas en este momento. ¡Estás al día!
              </div>
            )}
          </div>
        </div>

        {/* Accesos Rápidos Operativos */}
        <div className="col-span-1 lg:col-span-4 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
              <Zap className="size-4 text-primary" /> Acciones del Turno
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
                    Responder a tus clientes asignados en vivo
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
                    Cola de Escalaciones
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Reclamar tickets en espera de tu área
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <p className="font-semibold text-primary mb-0.5">Consejo operativo</p>
            <p className="text-[11px]">
              Completar o cerrar casos libera tu cupo de concurrencia y permite que el sistema te
              asigne nuevos chats sin sobrecargarte.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
