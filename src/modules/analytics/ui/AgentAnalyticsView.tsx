import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Inbox,
  UserCheck,
  Clock,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useSession } from "@/modules/identity/application/use-session";
import { getDashboard } from "@/modules/dashboard/infrastructure/dashboard.gateway";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import type { DashboardDto } from "@/modules/dashboard/domain/dashboard";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import { conversationDisplayName } from "@/modules/conversations/domain/conversation";
import { relativeTime } from "@/shared/datetime";

export function AgentAnalyticsView() {
  const session = useSession();
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.id) return;
    setLoading(true);
    Promise.all([
      getDashboard(session.id).then(setDashboard),
      listConversations({ status: "open" }).then(setConversations),
    ])
      .catch((err) => console.error("Error cargando métricas personales del agente:", err))
      .finally(() => setLoading(false));
  }, [session?.id]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner de Bienvenida y Estado Operativo */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0 shadow-xs ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                Mi Panel de Rendimiento
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                {session?.roleLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hola, <span className="font-semibold text-foreground">{session?.name}</span>. Este es
              tu resumen operativo personal de atención y casos activos en tiempo real.
            </p>
          </div>
        </div>

        <Link
          to="/bandeja"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Inbox className="size-4" />
          <span>Ir a mi bandeja</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* Indicadores Personales Clave */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp className="size-3.5 text-primary" /> Mis Indicadores Operativos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Casos Asignados */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Casos Asignados
              </span>
              <UserCheck className="size-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
              {loading ? "—" : (dashboard?.myAssignedCases ?? 0)}
            </p>
            <p className="text-[11px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
              Bajo tu atención activa
            </p>
          </div>

          {/* Conversaciones Abiertas */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Conversaciones Abiertas
              </span>
              <MessageSquare className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
              {loading ? "—" : (dashboard?.openConversations ?? 0)}
            </p>
            <p className="text-[11px] mt-1 text-muted-foreground">En curso con clientes</p>
          </div>

          {/* Esperando Cliente */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Esperando Cliente
              </span>
              <Clock className="size-4 text-sky-500" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
              {loading ? "—" : (dashboard?.waitingUser ?? 0)}
            </p>
            <p className="text-[11px] mt-1 text-muted-foreground">Pendientes de respuesta</p>
          </div>

          {/* Escalados Pendientes */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Escalados Pendientes
              </span>
              <Zap className="size-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">
              {loading ? "—" : (dashboard?.escalatedPending ?? 0)}
            </p>
            <p className="text-[11px] mt-1 text-amber-600 dark:text-amber-400 font-medium">
              Casos derivados por el bot
            </p>
          </div>
        </div>
      </section>

      {/* Grid: Conversaciones Actuales y Recomendaciones de Calidad */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mis Conversaciones Abiertas */}
        <div className="col-span-1 lg:col-span-7 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" /> Mis Conversaciones Activas
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {conversations.length} en cola
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-80 pr-1">
            {conversations.slice(0, 15).map((c) => (
              <Link
                key={c.id}
                to="/bandeja"
                className="p-3 hover:bg-foreground/5 rounded-xl transition-colors block group"
              >
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {conversationDisplayName(c)}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {relativeTime(c.lastActivityAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.lastMessagePreview?.body ?? "Sin mensajes recientes"}
                </p>
              </Link>
            ))}

            {conversations.length === 0 && !loading && (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No tienes conversaciones abiertas en este momento. ¡Estás al día!
              </div>
            )}
          </div>
        </div>

        {/* Buenas Prácticas de Cordialidad y Calidad */}
        <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-border pb-3">
              <ShieldCheck className="size-4 text-emerald-500" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
                Criterios de Calidad Operativa
              </h3>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Cada interacción completada es auditada automáticamente por el motor de supervisión.
              Pautas clave para mantener un score sobresaliente:
            </p>

            <ul className="space-y-3 text-xs text-foreground/90">
              <li className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold grid place-items-center text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  <strong>Primer Tiempo de Respuesta (FRT):</strong> Procura responder el primer
                  mensaje en menos de 2 minutos tras la asignación.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold grid place-items-center text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  <strong>Resolución en Primer Contacto (FCR):</strong> Asegura que el cliente no
                  tenga que reiterar su consulta en las siguientes 48 horas.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold grid place-items-center text-[10px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  <strong>Tono Cordial:</strong> Utiliza siempre el saludo inicial y cierre formal de
                  la empresa evitando respuestas cortantes.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">¿Dudas operativas?</span>
            <Link
              to="/chat-interno"
              className="font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Consultar con tu supervisor <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
