import { Layers, MessageSquare, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
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
import type { TelegramTopicCategory, TelegramTopicConfig } from "../../domain/settings.types";

interface TelegramTopicsSectionProps {
  topicsEnabled: boolean;
  topics: TelegramTopicConfig[];
  testingTopicId: string | null;
  onToggleTopicsEnabled: (enabled: boolean) => void;
  onAddTopic: () => void;
  onUpdateTopic: (id: string, updates: Partial<TelegramTopicConfig>) => void;
  onDeleteTopic: (id: string) => void;
  onResetTopics: () => void;
  onTestTopic: (topic: TelegramTopicConfig) => void;
}

export function TelegramTopicsSection({
  topicsEnabled,
  topics,
  testingTopicId,
  onToggleTopicsEnabled,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onResetTopics,
  onTestTopic,
}: TelegramTopicsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Modo de Recepción en Telegram
            </h3>
            <Badge
              variant="outline"
              className={
                topicsEnabled
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 text-xs"
                  : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 text-xs"
              }
            >
              {topicsEnabled ? "Foro con Temas / Hilos" : "Chat Único / General"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Elegí cómo querés recibir los avisos en tu grupo de Telegram: en un solo chat o
            divididos en foros.
          </p>
        </div>

        <div className="inline-flex p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => onToggleTopicsEnabled(false)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              !topicsEnabled
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground font-normal"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Modo Chat Único</span>
            {!topicsEnabled && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleTopicsEnabled(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              topicsEnabled
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground font-normal"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Modo Temas / Foros</span>
            {topicsEnabled && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {!topicsEnabled ? (
        <div className="rounded-xl border border-sky-200/70 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-900/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Modo Chat Único Activo (Recomendado para grupos estándar)
                </h4>
                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                  En uso
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Todos los avisos de SLA, caídas de fibra y pulsos operativos ejecutivos se enviarán
                directamente al <b>chat principal de tu grupo</b> (un único flujo continuo).
              </p>
              <div className="pt-2 text-xs text-muted-foreground space-y-1 border-t border-sky-200/50 dark:border-sky-900/40">
                <p className="font-semibold text-foreground/80">
                  ¿Cuándo usar el Modo Temas / Foros?
                </p>
                <p>
                  Solo si en Telegram entraste a los ajustes de tu grupo y activaste la opción{" "}
                  <b>&quot;Temas&quot; (Foros)</b>. Eso divide el grupo en pestañas separadas. Si tu
                  grupo es normal, <b>mantené este Modo Chat Único</b>.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleTopicsEnabled(true)}
              className="text-xs h-8 gap-1.5 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 font-medium"
            >
              <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              Cambiar a Modo Temas (Foro)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>
                <b>Modo Temas Activo:</b> Cada categoría se envía al hilo (
                <code>message_thread_id</code>) correspondiente.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onToggleTopicsEnabled(false)}
                className="text-xs h-7 gap-1"
              >
                <MessageSquare className="h-3 w-3 text-sky-600" />
                Volver a Chat Único
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onAddTopic}
                className="text-xs h-7 gap-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                <Plus className="h-3 w-3" />
                Agregar Tema
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {topics.length > 0 ? (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      id={`topic-switch-${topic.id}`}
                      checked={topic.enabled}
                      onCheckedChange={(checked) => onUpdateTopic(topic.id, { enabled: checked })}
                    />
                    <Badge
                      variant={topic.enabled ? "default" : "secondary"}
                      className="text-[11px] font-normal"
                    >
                      {topic.enabled ? "Activo" : "Silenciado"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Nombre del Tema
                      </Label>
                      <Input
                        value={topic.name}
                        onChange={(e) => onUpdateTopic(topic.id, { name: e.target.value })}
                        placeholder="Ej. Alertas de SLA"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Categoría de Avisos
                      </Label>
                      <Select
                        value={topic.category}
                        onValueChange={(val) =>
                          onUpdateTopic(topic.id, { category: val as TelegramTopicCategory })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SLA">Alertas de SLA & Esperas</SelectItem>
                          <SelectItem value="INFRASTRUCTURE">
                            Infraestructura & Fibra / OLT
                          </SelectItem>
                          <SelectItem value="DIGEST">Pulso Operativo (Digests)</SelectItem>
                          <SelectItem value="QUEUE">Desborde de Cola</SelectItem>
                          <SelectItem value="QUALITY">Supervisión de Calidad IA</SelectItem>
                          <SelectItem value="GENERAL">Avisos Generales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        ID del Hilo (thread_id)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={topic.threadId || ""}
                        onChange={(e) =>
                          onUpdateTopic(topic.id, {
                            threadId: Number(e.target.value) || 1,
                          })
                        }
                        placeholder="Ej. 12"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onTestTopic(topic)}
                      disabled={testingTopicId === topic.id}
                      className="h-8 text-xs gap-1.5"
                      title="Enviar mensaje de prueba a este hilo"
                    >
                      {testingTopicId === topic.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      )}
                      <span>Probar Hilo</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTopic(topic.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      title="Eliminar tema"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10 space-y-2">
                <p className="text-xs text-muted-foreground">
                  No hay temas configurados. Los avisos se dirigirán al chat general.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onResetTopics}
                  className="text-xs h-8"
                >
                  Restablecer temas recomendados
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
