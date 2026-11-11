import { RefreshCw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface TelegramSaveFooterProps {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function TelegramSaveFooter({
  isDirty,
  saving,
  onSave,
  onDiscard,
}: TelegramSaveFooterProps) {
  return (
    <>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 py-4">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 text-xs shrink-0"
            >
              Cambios pendientes
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs shrink-0"
            >
              Sincronizado
            </Badge>
          )}
          <p className="text-xs text-muted-foreground">
            {isDirty
              ? "Tenés cambios sin confirmar. Presioná guardar para aplicarlos en la base de datos."
              : "La configuración está sincronizada con la base de datos y activa en el backend."}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDiscard}
              disabled={saving}
              className="text-xs h-9"
            >
              Descartar
            </Button>
          )}
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="gap-2 text-xs font-semibold h-9"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Configuración de Telegram
          </Button>
        </div>
      </CardFooter>

      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-2.5 sm:p-3 px-4 bg-background/95 dark:bg-card/95 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="font-semibold text-foreground text-xs hidden sm:inline">
              Cambios sin guardar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDiscard}
              disabled={saving}
              className="h-8 text-xs"
            >
              Descartar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="h-8 text-xs gap-1.5 font-bold shadow-md bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
