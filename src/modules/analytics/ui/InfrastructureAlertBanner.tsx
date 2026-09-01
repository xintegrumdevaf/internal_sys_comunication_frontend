import { AlertTriangle, Radio, ShieldAlert } from "lucide-react";
import type { InfrastructureAlertDto } from "../domain/analytics.types";

interface InfrastructureAlertBannerProps {
  alerts: InfrastructureAlertDto[];
}

export function InfrastructureAlertBanner({ alerts }: InfrastructureAlertBannerProps) {
  const highVolumeAlerts = alerts.filter((a) => a.isHighVolumeAlert);

  if (highVolumeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 animate-fade-down">
      {highVolumeAlerts.map((alert, index) => (
        <div
          key={`${alert.sector}-${alert.oltName ?? index}`}
          className="relative overflow-hidden rounded-2xl border border-danger/40 bg-danger/10 p-4 sm:p-5 shadow-md flex items-start gap-4"
        >
          <div className="size-10 rounded-xl bg-danger/20 text-danger grid place-items-center shrink-0 animate-pulse ring-1 ring-danger/40">
            <AlertTriangle className="size-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                Alerta Crítica de Infraestructura
              </span>
              {alert.oltName && (
                <span className="px-2 py-0.5 rounded-md bg-danger/15 text-danger font-mono text-[11px] font-bold">
                  OLT: {alert.oltName}
                </span>
              )}
            </div>

            <h4 className="mt-1.5 text-sm sm:text-base font-extrabold text-danger tracking-tight">
              Posible corte masivo en {alert.sector} ({alert.activeCasesCount} reclamos activos)
            </h4>

            <p className="mt-0.5 text-xs text-foreground/80">
              Se detectó una concentración atípica de incidentes simultáneos en esta zona. Se
              recomienda verificar el estado de la fibra y emitir comunicación preventiva a los
              clientes afectados para contener escalaciones.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end justify-center shrink-0">
            <div className="flex items-center gap-1.5 text-danger text-xs font-bold">
              <Radio className="size-4 animate-ping" />
              <span>En vivo</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
