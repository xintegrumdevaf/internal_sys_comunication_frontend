import { Activity, Bell, BellRing, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  TelegramAlertRuleCategory,
  TelegramAlertRuleConfig,
} from "../../domain/settings.types";

interface TelegramSentinelRulesSectionProps {
  alertRules: TelegramAlertRuleConfig[];
  defaultChatId: string;
  testingAlerts: boolean;
  testingAlertCategory: string | null;
  onAddRule: () => void;
  onUpdateRule: (id: string, updates: Partial<TelegramAlertRuleConfig>) => void;
  onDeleteRule: (id: string) => void;
  onResetRules: () => void;
  onCheckAlertsNow: () => void;
  onTestAlert: (category: "SLA" | "INFRASTRUCTURE" | "QUEUE") => void;
}

export function TelegramSentinelRulesSection({
  alertRules,
  defaultChatId,
  testingAlerts,
  testingAlertCategory,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onResetRules,
  onCheckAlertsNow,
  onTestAlert,
}: TelegramSentinelRulesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
            Umbrales del Centinela Reactivo
          </h3>
          <Badge variant="outline" className="text-xs font-normal">
            Configurable
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddRule}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar Regla
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCheckAlertsNow}
            disabled={testingAlerts || !defaultChatId}
            className="gap-1.5 h-8 text-xs"
          >
            {testingAlerts ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5 text-rose-500" />
            )}
            Evaluar Alertas Ahora
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        El Centinela supervisa continuamente casos desatendidos, colas de espera y caídas de
        infraestructura. Podés añadir nuevas reglas, ajustar umbrales, pausar o eliminar alertas
        según los requerimientos operativos.
      </p>

      <div className="space-y-3">
        {alertRules.length > 0 ? (
          alertRules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3 shrink-0">
                <Switch
                  id={`rule-switch-${rule.id}`}
                  checked={rule.enabled}
                  onCheckedChange={(checked) => onUpdateRule(rule.id, { enabled: checked })}
                />
                <Badge
                  variant={
                    rule.enabled
                      ? rule.severity === "CRITICAL"
                        ? "destructive"
                        : "default"
                      : "secondary"
                  }
                  className="text-[11px] font-normal"
                >
                  {rule.enabled ? rule.severity : "Pausada"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1">
                <div className="sm:col-span-4 space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    Nombre de la Regla
                  </Label>
                  <Input
                    value={rule.name}
                    onChange={(e) => onUpdateRule(rule.id, { name: e.target.value })}
                    placeholder="Ej. Demora Crítica de SLA"
                    className="h-8 text-xs font-medium"
                  />
                  {rule.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {rule.description}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    Tipo de Alerta
                  </Label>
                  <Select
                    value={rule.category}
                    onValueChange={(val) =>
                      onUpdateRule(rule.id, { category: val as TelegramAlertRuleCategory })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SLA">Demoras en SLA (Asesor)</SelectItem>
                      <SelectItem value="INFRASTRUCTURE">Corte Masivo / OLT</SelectItem>
                      <SelectItem value="QUEUE">Saturación de Cola</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    Umbral & Unidad
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      value={rule.threshold}
                      onChange={(e) =>
                        onUpdateRule(rule.id, {
                          threshold: Number(e.target.value) || 1,
                        })
                      }
                      className="h-8 w-20 text-xs font-mono"
                    />
                    <Input
                      value={rule.unit}
                      onChange={(e) => onUpdateRule(rule.id, { unit: e.target.value })}
                      placeholder="minutos"
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Severidad</Label>
                  <Select
                    value={rule.severity}
                    onValueChange={(val) =>
                      onUpdateRule(rule.id, { severity: val as "CRITICAL" | "WARNING" | "INFO" })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">🚨 Crítico</SelectItem>
                      <SelectItem value="WARNING">⚠️ Alerta</SelectItem>
                      <SelectItem value="INFO">ℹ️ Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onTestAlert(rule.category)}
                  disabled={testingAlertCategory === rule.category}
                  className="h-8 text-xs gap-1.5"
                  title={`Simular y enviar alerta de ${rule.name} a Telegram`}
                >
                  {testingAlertCategory === rule.category ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BellRing className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>Simular Alerta</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteRule(rule.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  title="Eliminar regla"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10 space-y-2">
            <p className="text-xs text-muted-foreground">
              No hay reglas de alerta configuradas. El Centinela no evaluará anomalías reactivas.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetRules}
              className="text-xs h-8"
            >
              Restablecer reglas recomendadas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
