import { Cpu, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TelegramCopilotWebhookSectionProps {
  commandsEnabled: boolean;
  aiCopilotEnabled: boolean;
  hasBotToken: boolean;
  syncingWebhook: boolean;
  onToggleCommands: (checked: boolean) => void;
  onToggleCopilot: (checked: boolean) => void;
  onSyncWebhook: () => void;
}

export function TelegramCopilotWebhookSection({
  commandsEnabled,
  aiCopilotEnabled,
  hasBotToken,
  syncingWebhook,
  onToggleCommands,
  onToggleCopilot,
  onSyncWebhook,
}: TelegramCopilotWebhookSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Cpu className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          Interacción Bidireccional & Copilot con IA
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="commands-enabled" className="text-sm font-medium cursor-pointer">
                Comandos en Grupo
              </Label>
              <p className="text-xs text-muted-foreground">
                Permite enviar <code>/resumen</code>, <code>/sla</code>, <code>/agentes</code>,{" "}
                <code>/infra</code> y botones en línea.
              </p>
            </div>
            <Switch
              id="commands-enabled"
              checked={commandsEnabled}
              onCheckedChange={onToggleCommands}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="copilot-enabled" className="text-sm font-medium cursor-pointer">
                Copilot con IA (Lenguaje Natural)
              </Label>
              <p className="text-xs text-muted-foreground">
                Responde preguntas libres en el chat con Grounding determinístico sobre métricas
                reales.
              </p>
            </div>
            <Switch
              id="copilot-enabled"
              checked={aiCopilotEnabled}
              onCheckedChange={onToggleCopilot}
            />
          </div>
        </div>
      </div>

      <div className="bg-sky-50/50 dark:bg-sky-950/20 p-4 rounded-lg border border-sky-100 dark:border-sky-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-sky-900 dark:text-sky-300">
            Sincronización de Webhook con Telegram
          </h4>
          <p className="text-xs text-muted-foreground">
            Registra automáticamente la URL pública del backend y un token secreto en{" "}
            <code>api.telegram.org</code>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSyncWebhook}
          disabled={syncingWebhook || !hasBotToken}
          className="gap-2 shrink-0 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50"
        >
          {syncingWebhook ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
          Sincronizar Webhook
        </Button>
      </div>
    </div>
  );
}
