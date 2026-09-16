import { useState, useEffect } from "react";
import { Clock, ShieldCheck, Volume2, VolumeX, Save, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSlaConfig } from "@/modules/sla/application/use-sla-config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const THRESHOLD_OPTIONS = [
  { value: 3, label: "3 Minutos (Atención Ultra Rápida)" },
  { value: 5, label: "5 Minutos (Recomendado / Estándar)" },
  { value: 10, label: "10 Minutos" },
  { value: 15, label: "15 Minutos" },
  { value: 30, label: "30 Minutos" },
];

export function SlaSettingsModal({ open, onOpenChange }: Props) {
  const { config, saveConfig, saving } = useSlaConfig();

  const [threshold, setThreshold] = useState<number>(config.responseThresholdMinutes);
  const [enabled, setEnabled] = useState<boolean>(config.enabled);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(config.alertSoundEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setThreshold(config.responseThresholdMinutes);
      setEnabled(config.enabled);
      setSoundEnabled(config.alertSoundEnabled);
      setSavedSuccess(false);
    }
  }, [open, config]);

  const handleSave = async () => {
    const ok = await saveConfig({
      ...config,
      responseThresholdMinutes: threshold,
      enabled,
      alertSoundEnabled: soundEnabled,
    });
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onOpenChange(false);
      }, 1000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <Clock className="size-5 text-primary" />
            Configuración de Alertas de No Respuesta (SLA)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configura el tiempo máximo tolerable para que un asesor responda los mensajes entrantes
            de clientes. Los cambios se aplican a toda la organización.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Activar / Desactivar Alertas */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
            <div>
              <p className="text-xs font-bold text-foreground">Sistema de Alertas SLA</p>
              <p className="text-[11px] text-muted-foreground">
                Resaltar visualmente las conversaciones pendientes de respuesta
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Límite de Tiempo Configurable por el Admin */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Tiempo Límite de Respuesta (Límite Configurable por el Admin)
            </label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={!enabled}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {THRESHOLD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Si un cliente escribe y transcurre más de{" "}
              <span className="font-bold text-primary">{threshold} minutos</span> sin respuesta del
              asesor, se generará la alerta visual en la bandeja.
            </p>
          </div>

          {/* Opción de Sonido de Alerta */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="size-4 text-primary" />
              ) : (
                <VolumeX className="size-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs font-bold text-foreground">Notificación Sonora</p>
                <p className="text-[11px] text-muted-foreground">
                  Emitir un sonido al sobrepasar el tiempo límite
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={!enabled}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                soundEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-bold animate-fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              Configuración de SLA guardada exitosamente.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold uppercase rounded-xl border border-border hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="px-4 py-2 text-xs font-bold uppercase rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="size-3.5" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
