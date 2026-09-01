import { Link } from "@tanstack/react-router";
import { MessageSquare, Star, Users, UserCheck, ShieldAlert } from "lucide-react";
import type { AgentPerformanceDto } from "../domain/analytics.types";
import { initialsFromName } from "@/modules/identity/domain/session";

interface AgentPerformanceTableProps {
  agents: AgentPerformanceDto[];
  isLoading?: boolean;
}

export function AgentPerformanceTable({ agents, isLoading }: AgentPerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            Admin
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            Jefe de Área
          </span>
        );
      case "agent":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Agente
          </span>
        );
    }
  };

  const formatFrt = (ms: number | null) => {
    if (ms === null || ms === undefined) return "—";
    const minutes = ms / 60000;
    if (minutes < 1) {
      const seconds = Math.round(ms / 1000);
      return `${seconds}s`;
    }
    return `${minutes.toFixed(1)}m`;
  };

  const formatAht = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return "—";
    return `${minutes.toFixed(1)}m`;
  };

  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return `${val.toFixed(1)}%`;
  };

  const getCapacityBadge = (active: number, max: number) => {
    const ratio = max > 0 ? active / max : 0;
    let color = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    let status = "Normal";

    if (ratio >= 1) {
      color = "bg-danger/10 text-danger border-danger/30 animate-pulse";
      status = "Saturado";
    } else if (ratio >= 0.75) {
      color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      status = "Carga Alta";
    }

    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${color}`}
          title={`Capacidad: ${active} de ${max} (${status})`}
        >
          {active}/{max}
        </span>
      </div>
    );
  };

  const getCordialityBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return <span className="text-muted-foreground text-xs">—</span>;
    }

    // Normalizado a 100 o escala 1-5
    const isFiveScale = score <= 5;
    const isGood = isFiveScale ? score >= 4.2 : score >= 80;
    const isMedium = isFiveScale ? score >= 3.5 : score >= 65;

    let color = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (!isGood && isMedium) {
      color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    } else if (!isGood && !isMedium) {
      color = "bg-danger/10 text-danger border-danger/30";
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}
      >
        <Star className="size-3 fill-current" />
        {score.toFixed(1)}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
            Rendimiento y Saturación del Equipo ({agents.length} agentes)
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          Sincronizado con estado en vivo y métricas a 48h
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-background/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3">Agente</th>
              <th className="py-2.5 px-3">Rol</th>
              <th className="py-2.5 px-3">Carga en Vivo</th>
              <th className="py-2.5 px-3" title="First Response Time">
                FRT
              </th>
              <th className="py-2.5 px-3" title="Average Handling Time">
                AHT
              </th>
              <th className="py-2.5 px-3" title="First Contact Resolution (no reincidencia en 48h)">
                FCR % (48h)
              </th>
              <th className="py-2.5 px-3">Cordialidad</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agents.map((agent) => (
              <tr
                key={agent.agentId}
                className="hover:bg-foreground/5 transition-colors group"
              >
                {/* Nombre y departamento */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-bold shrink-0 ring-1 ring-primary/20">
                      {initialsFromName(agent.agentName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{agent.agentName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {agent.primaryDepartmentName ?? "Sin dpto."}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Rol */}
                <td className="py-3 px-3">{getRoleBadge(agent.role)}</td>

                {/* Carga en vivo */}
                <td className="py-3 px-3">
                  {getCapacityBadge(agent.activeCasesNow, agent.maxCapacityThreshold)}
                </td>

                {/* FRT */}
                <td className="py-3 px-3 font-mono font-medium text-foreground">
                  {formatFrt(agent.avgFirstResponseTimeMs)}
                </td>

                {/* AHT */}
                <td className="py-3 px-3 font-mono font-medium text-foreground">
                  {formatAht(agent.avgHandlingTimeMinutes)}
                </td>

                {/* FCR % */}
                <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPercent(agent.fcrRatePercentage)}
                </td>

                {/* Cordialidad */}
                <td className="py-3 px-3">{getCordialityBadge(agent.avgCordialityScore)}</td>

                {/* Chat 1:1 directo */}
                <td className="py-3 px-3 text-right">
                  <Link
                    to="/chat-interno"
                    search={{ peerId: agent.agentId }}
                    title={`Abrir chat 1:1 con ${agent.agentName}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-semibold text-muted-foreground transition-all shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="size-3.5" />
                    <span className="hidden sm:inline">Chat 1:1</span>
                  </Link>
                </td>
              </tr>
            ))}

            {agents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                  No hay datos de rendimiento de agentes para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
