import React from "react";
import {
  Calendar,
  Eye,
  Pause,
  Play,
  Trash2,
  RotateCcw,
  Bot,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type Campaign,
  campaignStatusMeta,
  formatRoutingBehaviorSummary,
} from "../domain/campaign";

interface CampaignsTableRowProps {
  campaign: Campaign;
  isProcessing: boolean;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onSuspend: (id: string) => void;
  onResume: (id: string) => void;
  onDeleteRequest: (id: string) => void;
}

export const CampaignsTableRow: React.FC<CampaignsTableRowProps> = ({
  campaign: c,
  isProcessing,
  onSelect,
  onStart,
  onSuspend,
  onResume,
  onDeleteRequest,
}) => {
  const meta = campaignStatusMeta(c.status);
  const behavior = formatRoutingBehaviorSummary(c.routingConfig);
  const safeSent = Math.max(0, c.sentCount || 0);
  const safeTotal = Math.max(0, c.totalRecipients || 0);
  const progressPct =
    safeTotal > 0 ? Math.min(100, Math.round((safeSent / safeTotal) * 100)) : 0;

  const createdDateStr = new Date(c.createdAt).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <tr className="hover:bg-muted/20 transition-colors">
      {/* Nombre */}
      <td className="px-4 py-3 text-foreground">
        <div
          className="font-bold text-xs text-foreground cursor-pointer hover:text-primary transition-colors truncate"
          onClick={() => onSelect(c.id)}
          title="Ver detalle de campaña"
        >
          {c.name}
        </div>
        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
          {c.templateName ? `Plantilla: ${c.templateName}` : c.messageText || "Sin mensaje"}
        </div>
      </td>

      {/* Creado en */}
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <Calendar className="w-3.5 h-3.5 opacity-60 shrink-0" />
          <span>{createdDateStr}</span>
        </div>
      </td>

      {/* Progreso Gráfico (Corrige glitch de números y agrega barra visual) */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-bold text-foreground">
              {safeSent} / {safeTotal}
            </span>
            <span className="font-semibold text-primary">{progressPct}%</span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                c.status === "COMPLETED" || c.status === "FINISHED"
                  ? "bg-emerald-500"
                  : c.status === "RUNNING"
                    ? "bg-primary animate-pulse"
                    : "bg-primary/70"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </td>

      {/* Estado */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge
          variant="outline"
          className={`text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
        >
          {c.status === "RUNNING" && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping mr-1.5 inline-block" />
          )}
          {meta.label}
        </Badge>
      </td>

      {/* Comportamiento */}
      <td className="px-4 py-3 text-muted-foreground text-[11px] truncate">
        <div className="flex items-center gap-1.5 truncate" title={behavior}>
          {c.routingConfig?.delegateToBot ? (
            <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate">{behavior}</span>
        </div>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            onClick={() => onSelect(c.id)}
            title="Ver reporte y estadísticas"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          {c.status === "RUNNING" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase gap-1 text-amber-500 hover:text-amber-600 border-amber-500/30 rounded-lg cursor-pointer"
              onClick={() => onSuspend(c.id)}
              disabled={isProcessing}
            >
              <Pause className="w-3 h-3" />
              Pausar
            </Button>
          )}

          {c.status === "SUSPENDED" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase gap-1 text-emerald-500 hover:text-emerald-600 border-emerald-500/30 rounded-lg cursor-pointer"
              onClick={() => onResume(c.id)}
              disabled={isProcessing}
            >
              <Play className="w-3 h-3" />
              Reanudar
            </Button>
          )}

          {c.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold uppercase gap-1 text-blue-500 hover:text-blue-600 border-blue-500/30 rounded-lg cursor-pointer"
                onClick={() => onStart(c.id)}
                disabled={isProcessing}
              >
                <Play className="w-3 h-3" />
                Iniciar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                onClick={() => onDeleteRequest(c.id)}
                disabled={isProcessing}
                title="Eliminar borrador"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {(c.status === "COMPLETED" || c.status === "FINISHED") && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase gap-1 text-primary hover:text-primary/90 border-primary/30 rounded-lg cursor-pointer"
              onClick={() => onStart(c.id)}
              disabled={isProcessing}
              title="Reenviar campaña"
            >
              <RotateCcw className="w-3 h-3" />
              Reenviar
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
