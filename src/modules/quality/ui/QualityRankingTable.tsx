import { Loader2 } from "lucide-react";
import type { AgentQualityStatsDto } from "@/modules/quality/domain/quality-review";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface QualityRankingTableProps {
  stats: AgentQualityStatsDto[];
  loading: boolean;
  refreshing?: boolean;
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

export function QualityRankingTable({
  stats,
  loading,
  refreshing = false,
  selectedAgentId,
  onSelectAgent,
}: QualityRankingTableProps) {
  return (
    <div className="col-span-1 lg:col-span-4 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col h-full min-h-[480px]">
      <div className="p-4 sm:p-5 border-b border-border bg-background/60 shrink-0 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest">Ranking por Agente</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Score promedio de chats con valoración total.
          </p>
        </div>
        {refreshing && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse shrink-0">
            <Loader2 className="size-3 animate-spin" />
            <span>Actualizando</span>
          </span>
        )}
      </div>
      <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background/95 backdrop-blur border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold z-10">
            <tr>
              <th className="text-left px-3.5 py-3">Agente</th>
              <th className="text-right px-3.5 py-3">Chats</th>
              <th className="text-left px-3.5 py-3">Score</th>
              <th className="text-right px-3.5 py-3">Crít.</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-border transition-opacity duration-200 ${
              refreshing ? "opacity-50" : ""
            }`}
          >
            {loading && stats.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3.5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-6 rounded-full shrink-0" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 text-right">
                      <Skeleton className="h-3.5 w-10 ml-auto rounded" />
                    </td>
                    <td className="px-3.5 py-3.5">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-3.5 py-3.5 text-right">
                      <Skeleton className="h-3.5 w-6 ml-auto rounded" />
                    </td>
                  </tr>
                ))
              : stats.map((row) => {
                  const active = selectedAgentId === row.agentId;
                  return (
                    <tr
                      key={row.agentId}
                      className={`cursor-pointer transition-colors ${
                        active
                          ? "bg-primary/15 dark:bg-primary/25 border-l-4 border-l-primary font-bold shadow-2xs"
                          : "hover:bg-foreground/5 border-l-4 border-l-transparent"
                      }`}
                      onClick={() => onSelectAgent(row.agentId)}
                    >
                      <td className="px-3.5 py-3 font-semibold truncate max-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          {active && (
                            <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                          <span
                            className={
                              active
                                ? "text-primary dark:text-primary-foreground font-extrabold"
                                : ""
                            }
                          >
                            {row.agentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {row.analyzedCount}/{row.closedWithAgentMessages}
                      </td>
                      <td className="px-3.5 py-3">
                        <CordialityBadge
                          score={row.analyzedCount > 0 ? row.avgCordialityScore : null}
                        />
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold">
                        {row.criticalReviewCount > 0 ? (
                          <span className="text-danger font-bold">{row.criticalReviewCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

            {!loading && stats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-muted-foreground text-center">
                  Sin datos en este rango.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-border bg-background/80 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <span>
          {stats.length} {stats.length === 1 ? "agente" : "agentes"} en ranking
        </span>
        {selectedAgentId && (
          <span className="text-[11px] font-semibold text-primary">Filtrando por agente</span>
        )}
      </div>
    </div>
  );
}
