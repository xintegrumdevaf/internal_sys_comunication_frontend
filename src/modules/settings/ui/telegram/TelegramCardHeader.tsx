import { PowerOff, RefreshCw, Save, Send, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TelegramCardHeaderProps {
  enabled: boolean;
  saving: boolean;
  isDirty: boolean;
  onToggleEnabled: (checked: boolean) => void;
  onSave: () => void;
}

export function TelegramCardHeader({
  enabled,
  saving,
  isDirty,
  onToggleEnabled,
  onSave,
}: TelegramCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
              <Send className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Centinela & Ops de Telegram</CardTitle>
            {enabled ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-0.5 px-2.5 font-semibold text-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Activo en Vivo
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800 gap-1.5 py-0.5 px-2.5 font-semibold text-xs"
              >
                <span className="inline-flex rounded-full h-2 w-2 bg-slate-400" />
                Inactivo / En Pausa
              </Badge>
            )}
          </div>
          <CardDescription>
            Canal ejecutivo de supervisión para gerentes y directores: alertas reactivas de SLA y
            OLT, pulso periódico automático y copilot interactivo con IA.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <div
            className={`flex items-center gap-3 p-2 px-3 rounded-xl border transition-all ${
              enabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-xs"
                : "bg-muted/40 border-border text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-slate-400"
                }`}
              />
              <div className="flex flex-col">
                <Label htmlFor="telegram-enabled" className="text-xs font-bold cursor-pointer">
                  {enabled ? "Centinela Activo" : "Centinela Inactivo"}
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {enabled ? "Monitoreo y alertas en vivo" : "Alertas y comandos en pausa"}
                </span>
              </div>
            </div>
            <Switch id="telegram-enabled" checked={enabled} onCheckedChange={onToggleEnabled} />
          </div>

          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            variant={isDirty ? "default" : "outline"}
            className="gap-2 h-10 text-xs font-semibold px-4"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isDirty ? "Guardar Cambios" : "Guardado"}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}

export function TelegramInactiveBanner({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-xs shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0">
          <PowerOff className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            El Centinela está actualmente inactivo:
          </span>{" "}
          No se emitirán alertas automáticas a Telegram (SLA, saturación o caídas de red) ni
          responderá a preguntas mientras esté apagado.
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5 h-8 text-xs font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0 self-end sm:self-auto"
        onClick={onActivate}
      >
        <Zap className="h-3.5 w-3.5" />
        Activar Centinela
      </Button>
    </div>
  );
}
