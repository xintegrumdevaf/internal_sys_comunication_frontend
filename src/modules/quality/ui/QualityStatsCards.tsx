import { StatCard } from "@/app/shell/AppShell";

interface QualityStatsCardsProps {
  loading: boolean;
  agentsCount: number;
  chatsCount: number;
  incompleteMsgCount: number;
  pendingCount: number;
  failedCount: number;
}

export function QualityStatsCards({
  loading,
  agentsCount,
  chatsCount,
  incompleteMsgCount,
  pendingCount,
  failedCount,
}: QualityStatsCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Agentes evaluados" value={String(agentsCount)} loading={loading} />
      <StatCard label="Chats en lista" value={String(chatsCount)} loading={loading} />
      <StatCard
        label="Msgs incompletos"
        value={String(incompleteMsgCount)}
        hint="Conversaciones sin cobertura total"
        tone={incompleteMsgCount > 0 ? "warning" : undefined}
        loading={loading}
      />
      <StatCard
        label="En cola / fallidos"
        value={`${pendingCount} / ${failedCount}`}
        tone={pendingCount > 0 || failedCount > 0 ? "warning" : undefined}
        loading={loading}
      />
    </section>
  );
}
