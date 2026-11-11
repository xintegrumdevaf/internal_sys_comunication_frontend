import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { TelegramSettings, TestTelegramResult } from "../../domain/settings.types";

interface TelegramCredentialsSectionProps {
  settings: TelegramSettings;
  showToken: boolean;
  sendSampleOnTest: boolean;
  detectingChat: boolean;
  testing: boolean;
  testResult: TestTelegramResult | null;
  onToggleShowToken: () => void;
  onToggleSampleOnTest: (checked: boolean) => void;
  onChangeField: <K extends keyof TelegramSettings>(key: K, value: TelegramSettings[K]) => void;
  onDetectChatId: () => void;
  onTestConnection: () => void;
}

export function TelegramCredentialsSection({
  settings,
  showToken,
  sendSampleOnTest,
  detectingChat,
  testing,
  testResult,
  onToggleShowToken,
  onToggleSampleOnTest,
  onChangeField,
  onDetectChatId,
  onTestConnection,
}: TelegramCredentialsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Bot className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          Credenciales de Telegram Bot API
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bot-token" className="text-sm font-medium">
              Bot Token (de @BotFather)
            </Label>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-600 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Abrir BotFather <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="relative">
            <Input
              id="bot-token"
              type={showToken ? "text" : "password"}
              placeholder="123456789:AAEj_abcdef123456789..."
              value={settings.botToken}
              onChange={(e) => onChangeField("botToken", e.target.value)}
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={onToggleShowToken}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Token HTTP API entregado por @BotFather. Se almacena seguro en el backend y se presenta
            enmascarado.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="default-chat-id" className="text-sm font-medium">
              Chat ID Directivo (Supergrupo o Canal)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDetectChatId}
              disabled={detectingChat || !settings.botToken.trim()}
              className="h-6 text-[11px] gap-1 px-2 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950 font-normal"
              title="Detecta automáticamente el grupo donde añadiste a tu bot"
            >
              {detectingChat ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 text-amber-500" />
              )}
              Detectar Grupo
            </Button>
          </div>
          <Input
            id="default-chat-id"
            placeholder="-1001234567890 o @MiCanalDirectivo"
            value={settings.defaultChatId}
            onChange={(e) => onChangeField("defaultChatId", e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            ID numérico del grupo de gerencia (los supergrupos suelen comenzar con <code>-100</code>
            ). ¡Sumá tu bot al grupo y hacé clic en <b>Detectar Grupo</b> para completarlo solo!
          </p>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="frontend-url" className="text-xs font-semibold flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            URL Pública de la Plataforma Web (Frontend)
          </Label>
          <Input
            id="frontend-url"
            placeholder="http://localhost:8080 o https://tu-dominio.com"
            value={settings.frontendUrl || ""}
            onChange={(e) => onChangeField("frontendUrl", e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            URL base del panel web que se abrirá al presionar botones en Telegram como{" "}
            <i>&quot;Abrir caso en Panel&quot;</i> o <i>&quot;Atender caso&quot;</i>. Si estás
            testeando desde tu celular, podés configurar acá tu túnel o IP local.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-muted/20 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTestConnection}
            disabled={testing || !settings.botToken.trim()}
            className="gap-2"
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 text-amber-500" />
            )}
            Probar Bot (getMe)
          </Button>

          {!settings.botToken.trim() && (
            <span className="text-[11px] text-muted-foreground italic pl-1">
              (Cargá el Bot Token arriba para habilitar la prueba)
            </span>
          )}

          <div className="flex items-center space-x-2 pl-2">
            <Switch
              id="sample-msg-test"
              checked={sendSampleOnTest}
              onCheckedChange={onToggleSampleOnTest}
              disabled={!settings.defaultChatId}
            />
            <Label
              htmlFor="sample-msg-test"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Enviar mensaje de muestra al chat
            </Label>
          </div>
        </div>

        {testResult && testResult.ok && testResult.bot && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Bot autenticado: <b>@{testResult.bot.username || testResult.bot.first_name}</b> (ID:{" "}
              {testResult.bot.id})
            </span>
          </div>
        )}

        <div className="w-full pt-1">
          <p className="text-[11px] text-muted-foreground bg-muted/30 dark:bg-muted/10 px-2.5 py-1.5 rounded-md border">
            💡 <b>Validación segura sin guardar:</b> Las pruebas envían mensajes a Telegram usando
            lo que tengas escrito en pantalla en ese momento,{" "}
            <b>sin modificar ni sobreescribir la base de datos</b> hasta que confirmes con
            &quot;Guardar Cambios&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
