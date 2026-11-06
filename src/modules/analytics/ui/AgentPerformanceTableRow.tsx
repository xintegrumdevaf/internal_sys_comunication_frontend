import { Link } from "@tanstack/react-router";
import { MessageSquare, Star, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AgentPerformanceDto } from "../domain/analytics.types";
import { initialsFromName } from "@/modules/identity/domain/session";

interface AgentPerformanceTableRowProps {
  agent: AgentPerformanceDto;
}

export function AgentPerformanceTableRow({ agent }: AgentPerformanceTableRowProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            Admin
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            Jefe de Área
          </span>
        );
      case "agent":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Agente
          </span>
        );
    }
  };

  const formatFrt = (ms: number | null) => {
    if (ms === null || ms === undefined) return "—";
    if (ms < 10000) return "< 10s";
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    const minutes = ms / 60000;
    return minutes < 60 ? `${minutes.toFixed(1)}m` : `${(minutes / 60).toFixed(1)}h`;
  };

  const formatAht = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return "—";
    if (minutes < 1) return "< 1 min";
    return minutes < 60 ? `${minutes.toFixed(1)}m` : `${(minutes / 60).toFixed(1)}h`;
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
      <span
        className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${color}`}
        title={`Capacidad: ${active} de ${max} (${status})`}
      >
        {active}/{max}
      </span>
    );
  };

  const getCordialityBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return <span className="text-muted-foreground text-xs">—</span>;
    }
    const isFiveScale = score <= 5;
    const isGood = isFiveScale ? score >= 4.2 : score >= 80;
    const isMedium = isFiveScale ? score >= 3.5 : score >= 65;

    let color = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (!isGood && isMedium) {
      color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    } else if (!isGood && !isMedium) {
      color = "bg-danger/10 text-danger border-danger/30";
    }

    const label = isFiveScale ? `${score.toFixed(1)} / 5` : `${Math.round(score)} pts`;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}
        title={`Score de cordialidad: ${label}`}
      >
        <Star className="size-3 fill-current" />
        {label}
      </span>
    );
  };

  return (
    <tr className="hover:bg-foreground/5 transition-colors group">
      {/* Nombre y departamento */}
      <td className="py-2.5 px-3">
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
      <td className="py-2.5 px-3">{getRoleBadge(agent.role)}</td>

      {/* Carga en vivo */}
      <td className="py-2.5 px-3">
        {agent.activeCasesNow > 0 ? (
          <Link
            to="/bandeja"
            search={{ agentId: agent.agentId, tab: "open" }}
            title={`Ver los ${agent.activeCasesNow} casos activos de ${agent.agentName} en la bandeja`}
            className="hover:opacity-80 transition-opacity cursor-pointer inline-block"
          >
            {getCapacityBadge(agent.activeCasesNow, agent.maxCapacityThreshold)}
          </Link>
        ) : (
          getCapacityBadge(agent.activeCasesNow, agent.maxCapacityThreshold)
        )}
      </td>

      {/* Casos Asignados */}
      <td className="py-2.5 px-3">
        <div className="flex flex-col">
          <span className="font-mono font-bold text-foreground text-xs">{agent.casesAssigned}</span>
          <span className="text-[10px] text-muted-foreground">
            {agent.casesCompleted} resueltos
          </span>
        </div>
      </td>

      {/* Desatendidos */}
      <td className="py-2.5 px-3">
        {(agent.unattendedActiveCases ?? 0) > 0 ? (
          <Link
            to="/bandeja"
            search={{ agentId: agent.agentId, tab: "unattended" }}
            title={`Ver los ${agent.unattendedActiveCases} casos demorados de ${agent.agentName}`}
            className="flex flex-col gap-0.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 w-fit">
              <AlertTriangle className="size-3" />
              {agent.unattendedActiveCases}
            </span>
            {agent.maxPendingWaitMinutes != null && agent.maxPendingWaitMinutes > 0 && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-mono">
                {agent.maxPendingWaitMinutes >= 60
                  ? `${(agent.maxPendingWaitMinutes / 60).toFixed(1)}h espera`
                  : `${agent.maxPendingWaitMinutes}m espera`}
              </span>
            )}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
            <CheckCircle2 className="size-3" />0
          </span>
        )}
      </td>

      {/* FRT */}
      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
        {formatFrt(agent.avgFirstResponseTimeMs)}
      </td>

      {/* AHT */}
      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
        {formatAht(agent.avgHandlingTimeMinutes)}
      </td>

      {/* FCR % */}
      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
        {formatPercent(agent.fcrRatePercentage)}
      </td>

      {/* Cordialidad */}
      <td className="py-2.5 px-3">{getCordialityBadge(agent.avgCordialityScore)}</td>

      {/* Chat 1:1 directo */}
      <td className="py-2.5 px-3 text-right">
        <Link
          to="/chat-interno"
          search={{ peerId: agent.agentId }}
          title={`Abrir chat 1:1 con ${agent.agentName}`}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-semibold text-muted-foreground transition-all shadow-xs cursor-pointer"
        >
          <MessageSquare className="size-3" />
          <span className="hidden sm:inline">Chat</span>
        </Link>
      </td>
    </tr>
  );
}
