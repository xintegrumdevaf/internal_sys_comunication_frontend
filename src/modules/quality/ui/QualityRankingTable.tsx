import type { AgentQualityStatsDto } from "@/modules/quality/domain/quality-review";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";

interface QualityRankingTableProps {
  stats: AgentQualityStatsDto[];
  loading: boolean;
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

export function QualityRankingTable({
  stats,
  loading,
  selectedAgentId,
  onSelectAgent,
}: QualityRankingTableProps) {
  return (
    <div className="col-span-1 lg:col-span-4 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
      <div className="p-4 sm:p-5 border-b border-border bg-background/60">
        <h3 className="text-xs font-extrabold uppercase tracking-widest">Ranking por Agente</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Score promedio de chats con valoración total.
        </p>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead className="bg-background/80 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <tr>
              <th className="text-left px-3.5 py-3">Agente</th>
              <th className="text-right px-3.5 py-3">Chats</th>
              <th className="text-left px-3.5 py-3">Score</th>
              <th className="text-right px-3.5 py-3">Crít.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && stats.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3.5 py-3">
                      <div className="h-4 w-28 bg-foreground/10 rounded" />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="h-4 w-12 bg-foreground/10 rounded ml-auto" />
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="h-5 w-16 bg-foreground/10 rounded-full" />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="h-4 w-6 bg-foreground/10 rounded ml-auto" />
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
    </div>
  );
}
