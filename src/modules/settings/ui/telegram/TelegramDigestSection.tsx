import { Clock, Plus, RefreshCw, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TelegramDigestSectionProps {
  digestsEnabled: boolean;
  digestHours: string[];
  timeZone: string;
  defaultChatId: string;
  newHourInput: string;
  sendingDigest: boolean;
  onToggleDigestsEnabled: (checked: boolean) => void;
  onChangeNewHour: (val: string) => void;
  onAddDigestHour: () => void;
  onRemoveDigestHour: (hour: string) => void;
  onChangeTimeZone: (val: string) => void;
  onSendDigestNow: () => void;
}

export function TelegramDigestSection({
  digestsEnabled,
  digestHours,
  timeZone,
  defaultChatId,
  newHourInput,
  sendingDigest,
  onToggleDigestsEnabled,
  onChangeNewHour,
  onAddDigestHour,
  onRemoveDigestHour,
  onChangeTimeZone,
  onSendDigestNow,
}: TelegramDigestSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          Pulso Operativo Ejecutivo (Digests Programados)
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-muted/20 gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="digests-enabled" className="text-sm font-semibold cursor-pointer">
              Envío Automático de Pulso Programado
            </Label>
            <Badge variant={digestsEnabled ? "default" : "secondary"} className="text-xs">
              {digestsEnabled ? "Activo" : "Pausado"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Cuando está activo, el sistema genera y despacha automáticamente el reporte ejecutivo
            del ISP en los horarios configurados a continuación.
          </p>
        </div>
        <Switch
          id="digests-enabled"
          checked={digestsEnabled}
          onCheckedChange={onToggleDigestsEnabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Horarios de Envío Automático (Formato 24h)</Label>
          <div className="flex flex-wrap gap-2 min-h-10 items-center p-2 rounded-lg border bg-muted/20">
            {digestHours.map((hour) => (
              <Badge
                key={hour}
                variant="secondary"
                className="gap-1.5 pl-2.5 pr-1.5 py-1 text-sm bg-background border shadow-xs"
              >
                <span>{hour}</span>
                <button
                  type="button"
                  onClick={() => onRemoveDigestHour(hour)}
                  className="hover:text-destructive rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {digestHours.length === 0 && (
              <span className="text-xs text-muted-foreground italic">
                Sin horarios programados.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Ej. 08:30"
              value={newHourInput}
              onChange={(e) => onChangeNewHour(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddDigestHour();
                }
              }}
              className="w-32 text-sm font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddDigestHour}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar Horario
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium">
              Zona Horaria del Sistema
            </Label>
            <Input
              id="timezone"
              value={timeZone}
              onChange={(e) => onChangeTimeZone(e.target.value)}
              placeholder="America/Guayaquil"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Garantiza que los cortes se disparen en la hora local exacta del ISP.
            </p>
          </div>

          <div className="pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSendDigestNow}
              disabled={sendingDigest || !defaultChatId}
              className="gap-2 w-full sm:w-auto"
            >
              {sendingDigest ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Disparar Pulso Ahora (Prueba en Vivo)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
