import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCw, History, CheckCircle2, AlertCircle, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { conversationService } from "@/services/conversation.service";
import type { ZernioSyncStatus } from "@/types/department";

export function ZernioSyncControl() {
  const [modalOpen, setModalOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ZernioSyncStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await conversationService.getZernioHistorySyncStatus();
      if (status) {
        setSyncStatus(status);
        return status;
      }
    } catch {
      // Ignorar errores temporales de red durante el polling
    }
    return null;
  }, []);

  // Consultar estado al montar
  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // Polling si está corriendo
  useEffect(() => {
    if (syncStatus?.status === "running") {
      pollingRef.current = setInterval(async () => {
        const latest = await fetchStatus();
        if (latest && latest.status !== "running") {
          if (latest.status === "completed") {
            toast.success(
              `Sincronización completada: ${latest.totalMessagesSynced.toLocaleString()} mensajes importados`,
            );
          } else if (latest.status === "failed") {
            toast.error(
              latest.lastError
                ? `Error en la sincronización: ${latest.lastError}`
                : "La sincronización histórica falló",
            );
          }
        }
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [syncStatus?.status, fetchStatus]);

  const handleStartSync = async () => {
    setBusy(true);
    try {
      const res = await conversationService.startZernioHistorySync(days);
      toast.success(res.message || "Sincronización iniciada en segundo plano");
      setModalOpen(false);
      // Iniciar polling inmediato
      await fetchStatus();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo iniciar la sincronización con Zernio",
      );
    } finally {
      setBusy(false);
    }
  };

  const isRunning = syncStatus?.status === "running";

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de estado en ejecución */}
      {isRunning ? (
        <div
          role="status"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold animate-pulse shadow-xs"
        >
          <RotateCw className="size-3.5 animate-spin" />
          <span>
            Sincronizando: {syncStatus.totalMessagesSynced.toLocaleString()} mensajes importados...
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 text-foreground text-xs font-medium transition-colors shadow-xs cursor-pointer"
          title="Importar mensajes y conversaciones históricas desde Zernio"
        >
          <History className="size-3.5 text-primary" />
          <span className="hidden sm:inline font-bold">
            Sincronizar Mensajes Anteriores de WhatsApp
          </span>
          <span className="sm:hidden font-bold">Sincronizar Historial</span>
        </button>
      )}

      {/* Badge de último resultado exitoso */}
      {!isRunning && syncStatus?.status === "completed" && syncStatus.totalMessagesSynced > 0 && (
        <span
          className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          title={`Última sincronización completada. ${syncStatus.totalMessagesSynced} mensajes importados.`}
        >
          <CheckCircle2 className="size-3 shrink-0" />
          <span>{syncStatus.totalMessagesSynced.toLocaleString()} importados</span>
        </span>
      )}

      {/* Badge de último error */}
      {!isRunning && syncStatus?.status === "failed" && (
        <span
          className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-danger/10 text-danger border border-danger/20"
          title={syncStatus.lastError ?? "Error en la última sincronización"}
        >
          <AlertCircle className="size-3 shrink-0" />
          <span>Error en sincronización previa</span>
        </span>
      )}

      {/* Modal de confirmación */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zernio-sync-title"
        >
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start justify-between gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <History className="size-5" />
              </div>
              <div className="flex-1">
                <h3
                  id="zernio-sync-title"
                  className="text-sm sm:text-base font-bold text-foreground"
                >
                  Sincronizar Mensajes Anteriores de WhatsApp
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Esto importará las conversaciones y mensajes históricos de Zernio en segundo
                  plano.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs space-y-1.5 block">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  Rango de días a importar
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Selecciona qué tan atrás en el tiempo buscar mensajes no sincronizados.
                </p>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value={7}>Últimos 7 días</option>
                  <option value={15}>Últimos 15 días</option>
                  <option value={30}>Últimos 30 días (Recomendado)</option>
                  <option value={60}>Últimos 60 días</option>
                  <option value={90}>Últimos 90 días</option>
                </select>
              </label>

              <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Información operativa:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>El proceso se ejecuta en lotes asíncronos en el servidor.</li>
                  <li>No interrumpe la recepción de mensajes en tiempo real.</li>
                  <li>Puedes seguir atendiendo conversaciones mientras se sincroniza.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-border text-xs font-bold uppercase hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStartSync()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
              >
                {busy ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  "Iniciar Sincronización"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
