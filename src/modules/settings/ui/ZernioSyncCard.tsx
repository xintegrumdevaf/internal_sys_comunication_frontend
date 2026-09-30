import { useState, useEffect, useRef } from "react";
import { RefreshCw, History, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  startZernioHistorySync,
  getZernioHistorySyncStatus,
} from "@/modules/conversations/infrastructure/conversation.gateway";
import type { ZernioSyncStatus } from "@/types/department";
import { toast } from "sonner";

export function ZernioSyncCard() {
  const [syncStatus, setSyncStatus] = useState<ZernioSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = async () => {
    try {
      const status = await getZernioHistorySyncStatus();
      setSyncStatus(status);
      if (status.status !== "running" && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        if (status.status === "completed") {
          toast.success(`Historial sincronizado: ${status.totalMessagesSynced} mensajes importados`);
        } else if (status.status === "failed") {
          toast.error(status.lastError || "Error en la sincronización de Zernio");
        }
      }
    } catch {
      // Ignorar error transitorio de polling
    }
  };

  useEffect(() => {
    // Consulta inicial de estado
    void pollStatus();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleStartSync = async () => {
    setLoading(true);
    try {
      const res = await startZernioHistorySync(days);
      toast.info(res.message || "Sincronización de historial iniciada en segundo plano");
      void pollStatus();
      if (!pollingRef.current) {
        pollingRef.current = setInterval(pollStatus, 2500);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sincronización de Zernio");
    } finally {
      setLoading(false);
    }
  };

  const isRunning = syncStatus?.status === "running";
  const progressValue = syncStatus?.progress ?? (syncStatus?.status === "completed" ? 100 : 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Sincronización de Historial (Coexistencia Zernio)
            </CardTitle>
          </div>
          {syncStatus && (
            <Badge
              variant={
                syncStatus.status === "completed"
                  ? "default"
                  : syncStatus.status === "running"
                    ? "secondary"
                    : syncStatus.status === "failed"
                      ? "destructive"
                      : "outline"
              }
              className="capitalize"
            >
              {syncStatus.status === "running" && <RefreshCw className="size-3 mr-1 animate-spin" />}
              {syncStatus.status === "completed" && <CheckCircle2 className="size-3 mr-1 text-emerald-500" />}
              {syncStatus.status === "failed" && <AlertCircle className="size-3 mr-1 text-red-500" />}
              {syncStatus.status === "idle" && <Clock className="size-3 mr-1" />}
              {syncStatus.status}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Importa hacia PostgreSQL las conversaciones y mensajes antiguos que ocurrieron antes de conectar el webhook, permitiendo a los asesores ver el contexto previo completo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progreso de importación</span>
              <span className="font-semibold text-foreground">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Mensajes importados: {syncStatus?.totalMessagesSynced ?? 0}</span>
              {syncStatus?.totalItems ? <span>Total conversaciones: {syncStatus.totalItems}</span> : null}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <label htmlFor="sync-days" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Ventana de tiempo:
            </label>
            <select
              id="sync-days"
              disabled={isRunning || loading}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={60}>Últimos 60 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStartSync}
            disabled={isRunning || loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading || isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Sincronizando chats..." : "Sincronizar Mensajes Anteriores"}
          </Button>

          {syncStatus?.completedAt && !isRunning && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              Última sincronización: {new Date(syncStatus.completedAt).toLocaleString()} ({syncStatus.totalMessagesSynced} msgs)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
