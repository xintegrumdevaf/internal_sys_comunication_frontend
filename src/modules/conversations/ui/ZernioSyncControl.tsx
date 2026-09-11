import { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCw,
  History,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Clock,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { conversationService } from "@/services/conversation.service";
import type { ZernioSyncStatus } from "@/types/department";

interface ZernioSyncControlProps {
  onSyncComplete?: (status: ZernioSyncStatus) => void;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return isoString;
  }
}

function calculateDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return "—";
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));
    if (diffSec < 60) return `${diffSec} seg`;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  } catch {
    return "—";
  }
}

export function ZernioSyncControl({ onSyncComplete }: ZernioSyncControlProps = {}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"start" | "details">("start");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ZernioSyncStatus | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await conversationService.getZernioHistorySyncStatus();
      if (status) {
        // Calcular porcentaje visual si el servidor no envía progress
        const computedProgress =
          status.progress ??
          (status.status === "completed"
            ? 100
            : status.status === "running"
              ? Math.min(95, Math.max(15, (status.totalMessagesSynced || 0) > 0 ? 60 : 25))
              : 0);

        const statusWithProgress: ZernioSyncStatus = {
          ...status,
          progress: computedProgress,
        };

        setSyncStatus(statusWithProgress);
        window.dispatchEvent(
          new CustomEvent("zernio-sync-status-changed", { detail: statusWithProgress }),
        );
        return statusWithProgress;
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

  // Polling si está corriendo y detección de finalización basada en backend
  useEffect(() => {
    if (syncStatus?.status === "running") {
      pollingRef.current = setInterval(async () => {
        const latest = await fetchStatus();
        if (latest && latest.status !== "running") {
          if (latest.status === "completed") {
            toast.success(
              `¡Sincronización completada! ${latest.totalMessagesSynced.toLocaleString()} mensajes importados`,
            );
            window.dispatchEvent(
              new CustomEvent("zernio-sync-completed", { detail: latest }),
            );
            window.dispatchEvent(new Event("refresh-conversations"));
            onSyncComplete?.(latest);
          } else if (latest.status === "failed") {
            toast.error(
              latest.lastError
                ? `Error en sincronización: ${latest.lastError}`
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

    // Guardar referencia al estado anterior
    if (syncStatus?.status) {
      prevStatusRef.current = syncStatus.status;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [syncStatus?.status, fetchStatus, onSyncComplete]);

  const inFlightRef = useRef(false);

  const handleStartSync = async () => {
    if (isRunning || busy || inFlightRef.current) {
      toast.warning("Ya existe una sincronización en ejecución. Espera a que finalice.");
      return;
    }
    inFlightRef.current = true;
    setBusy(true);

    const startTimeIso = new Date().toISOString();
    const initialRunningStatus: ZernioSyncStatus = {
      status: "running",
      totalMessagesSynced: 0,
      startedAt: startTimeIso,
      completedAt: null,
      lastError: null,
      progress: 10,
    };

    // Aplicar estado optimista inicial para actualización inmediata de interfaz
    setSyncStatus(initialRunningStatus);
    window.dispatchEvent(
      new CustomEvent("zernio-sync-status-changed", { detail: initialRunningStatus }),
    );

    try {
      const res = await conversationService.startZernioHistorySync(days);
      toast.success(res.message || "Sincronización iniciada en segundo plano");
      setModalMode("details");
      setModalOpen(false);

      // Polling inmediato para consultar el estado real registrado por el backend
      await fetchStatus();
    } catch (e) {
      setSyncStatus(null);
      window.dispatchEvent(
        new CustomEvent("zernio-sync-status-changed", { detail: null }),
      );
      toast.error(
        e instanceof Error ? e.message : "No se pudo iniciar la sincronización con Zernio",
      );
    } finally {
      setBusy(false);
      inFlightRef.current = false;
    }
  };

  const triggerRefreshView = () => {
    window.dispatchEvent(new Event("refresh-conversations"));
    if (syncStatus) {
      onSyncComplete?.(syncStatus);
    }
    toast.success("Actualizando conversaciones de la bandeja...");
    setModalOpen(false);
  };

  const isRunning = syncStatus?.status === "running";
  const isCompleted = syncStatus?.status === "completed";
  const isFailed = syncStatus?.status === "failed";

  const openStartModal = () => {
    setModalMode("start");
    setModalOpen(true);
  };

  const openDetailsModal = () => {
    setModalMode("details");
    setModalOpen(true);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 1. Indicador en Ejecución */}
      {isRunning && (
        <button
          type="button"
          onClick={openDetailsModal}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold animate-pulse shadow-xs hover:bg-primary/20 transition-all cursor-pointer"
          title="Ver detalles de la sincronización en curso"
        >
          <RotateCw className="size-3.5 animate-spin" />
          <span>
            {`Sincronizando: ${syncStatus?.progress ?? 15}% (${syncStatus?.totalMessagesSynced.toLocaleString() ?? 0} msgs)...`}
          </span>
        </button>
      )}

      {/* 2. Badge de Sincronización Finalizada Exitosamente */}
      {!isRunning && isCompleted && (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={openDetailsModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Click para ver resumen completo de la sincronización"
          >
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            <span>
              {`Sincronización Finalizada (${syncStatus.totalMessagesSynced.toLocaleString()} msgs)`}
            </span>
          </button>

          <button
            type="button"
            onClick={openStartModal}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 text-foreground text-xs font-medium transition-colors shadow-xs cursor-pointer"
            title="Iniciar nueva sincronización de mensajes"
          >
            <History className="size-3 text-primary" />
            <span className="text-[11px] font-semibold">Nueva sinc.</span>
          </button>
        </div>
      )}

      {/* 3. Badge de Sincronización Fallida */}
      {!isRunning && isFailed && (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={openDetailsModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Click para ver el error de sincronización"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            <span>Sincronización Fallida</span>
          </button>

          <button
            type="button"
            onClick={openStartModal}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 text-foreground text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="size-3 text-primary" />
            <span className="text-[11px] font-semibold">Reintentar</span>
          </button>
        </div>
      )}

      {/* 4. Botón Normal cuando no ha iniciado nunca (Idle / Null) */}
      {!isRunning && !isCompleted && !isFailed && (
        <button
          type="button"
          onClick={openStartModal}
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

      {/* Modal de Control / Detalles */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zernio-sync-title"
        >
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in">
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                  isCompleted && modalMode === "details"
                    ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                    : isFailed && modalMode === "details"
                      ? "bg-danger/10 text-danger ring-1 ring-danger/20"
                      : isRunning
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20 animate-pulse"
                        : "bg-primary/10 text-primary"
                }`}
              >
                {isCompleted && modalMode === "details" ? (
                  <CheckCircle2 className="size-5" />
                ) : isFailed && modalMode === "details" ? (
                  <AlertCircle className="size-5" />
                ) : isRunning ? (
                  <RotateCw className="size-5 animate-spin" />
                ) : (
                  <History className="size-5" />
                )}
              </div>

              <div className="flex-1">
                <h3
                  id="zernio-sync-title"
                  className="text-sm sm:text-base font-bold text-foreground"
                >
                  {modalMode === "details"
                    ? isCompleted
                      ? "Sincronización Histórica Finalizada"
                      : isFailed
                        ? "Error en la Sincronización"
                        : "Sincronización en Curso"
                    : "Sincronizar Mensajes Anteriores de WhatsApp"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {modalMode === "details"
                    ? isCompleted
                      ? "El proceso finalizó correctamente y los mensajes están guardados."
                      : isFailed
                        ? "Ocurrió un problema durante la importación asíncrona de mensajes."
                        : "El proceso continúa ejecutándose en segundo plano."
                    : "Esto importará las conversaciones y mensajes históricos de Zernio en segundo plano."}
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

            {/* Contenido Modal: Modo Detalles de Finalización o Ejecución */}
            {modalMode === "details" ? (
              <div className="space-y-4 pt-1">
                {/* Badge Status Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : isFailed
                        ? "bg-danger/10 border-danger/20 text-danger"
                        : "bg-primary/10 border-primary/20 text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Estado:{" "}
                      {syncStatus?.status === "completed"
                        ? "FINALIZADA CON ÉXITO"
                        : syncStatus?.status === "failed"
                          ? "FALLIDA"
                          : syncStatus?.status === "running"
                            ? "EN EJECUCIÓN"
                            : "INACTIVA"}
                    </span>
                  </div>
                  {syncStatus?.completedAt && (
                    <span className="text-[11px] font-mono opacity-80">
                      {formatTime(syncStatus.completedAt)}
                    </span>
                  )}
                </div>

                {/* Barra de porcentaje de avance en vivo */}
                {isRunning && (
                  <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 space-y-1.5 animate-pulse">
                    <div className="flex justify-between items-center text-xs font-bold text-primary">
                      <span>Porcentaje de Avance</span>
                      <span className="font-mono text-xs font-extrabold">{syncStatus?.progress ?? 15}%</span>
                    </div>
                    <div className="w-full bg-primary/20 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, Math.max(8, syncStatus?.progress ?? 15))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Métricas detalladas */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="size-3 text-primary" /> Mensajes Importados
                    </span>
                    <p className="text-xl font-extrabold font-mono text-foreground mt-1">
                      {syncStatus?.totalMessagesSynced.toLocaleString() ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3 text-primary" /> Tiempo Transcurrido
                    </span>
                    <p className="text-xl font-extrabold font-mono text-foreground mt-1">
                      {calculateDuration(syncStatus?.startedAt ?? null, syncStatus?.completedAt ?? null)}
                    </p>
                  </div>
                </div>

                {/* Tiempos de Inicio y Fin */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Hora de Inicio:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatTime(syncStatus?.startedAt ?? null)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Hora de Finalización:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatTime(syncStatus?.completedAt ?? null)}
                    </span>
                  </div>
                </div>

                {/* En caso de error */}
                {syncStatus?.lastError && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger space-y-1">
                    <p className="font-bold">Detalle del error:</p>
                    <p className="font-mono text-[11px] break-all">{syncStatus.lastError}</p>
                  </div>
                )}

                {/* Botones del Modal de Detalles */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={openStartModal}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <History className="size-3.5" />
                    <span>Nueva sincronización</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerRefreshView}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase transition-colors shadow-xs hover:bg-primary/90 cursor-pointer"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Actualizar Bandeja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold uppercase hover:bg-foreground/5 transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Modo Configurar / Iniciar Sincronización */
              <div className="space-y-3 pt-1">
                {isRunning && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="size-4 shrink-0 text-amber-500" />
                    <p className="text-[11px] font-medium">
                      Ya existe una sincronización en curso. No es posible iniciar una nueva hasta que finalice la actual.
                    </p>
                  </div>
                )}

                <label className="text-xs space-y-1.5 block">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    Rango de días a importar
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Selecciona qué tan atrás en el tiempo buscar mensajes no sincronizados.
                  </p>
                  <select
                    disabled={busy || isRunning}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                    disabled={busy || isRunning}
                    onClick={() => void handleStartSync()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <RotateCw className="size-3.5 animate-spin" />
                        Iniciando...
                      </>
                    ) : isRunning ? (
                      <>
                        <RotateCw className="size-3.5 animate-spin" />
                        Sincronización en Curso
                      </>
                    ) : (
                      "Iniciar Sincronización"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

