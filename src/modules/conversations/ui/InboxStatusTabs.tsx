import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { InboxTab } from "./OperationalInbox";

export interface InboxStatusTabsProps {
  activeTab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  openCount: number;
  unassignedCount: number;
  unattendedCount: number;
  pendingCount: number;
  resolvedCount: number;
  closedCount: number;
}

export function InboxStatusTabs({
  activeTab,
  onTabChange,
  openCount,
  unassignedCount,
  unattendedCount,
  pendingCount,
  resolvedCount,
  closedCount,
}: InboxStatusTabsProps) {
  const tabs = [
    {
      value: "open" as InboxTab,
      label: "Abiertas",
      hint: "En curso",
      description:
        "Todas las conversaciones activas que se están atendiendo en este momento (por IA o asesores).",
      badge: openCount,
    },
    {
      value: "unassigned" as InboxTab,
      label: "En cola",
      hint: "Sin asesor",
      description:
        "Conversaciones que están esperando que un asesor humano tome el caso (sin asignar).",
      badge: unassignedCount,
      badgeColor: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    },
    {
      value: "unattended" as InboxTab,
      label: "Demoradas",
      hint: "Atención urgente",
      description:
        "Mensajes de clientes sin responder o con tiempo de espera superado (alerta de SLA).",
      badge: unattendedCount,
      badgeColor: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
    },
    {
      value: "pending" as InboxTab,
      label: "En espera",
      hint: "Pausadas",
      description:
        "Casos pausados esperando datos o comprobantes del cliente, o agendados para más tarde.",
      badge: pendingCount,
      badgeColor: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    },
    {
      value: "resolved" as InboxTab,
      label: "Resueltas",
      hint: "Solución entregada",
      description:
        "Atención finalizada con éxito. Si el cliente vuelve a escribir pronto, retoma este mismo caso.",
      badge: resolvedCount,
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      value: "closed" as InboxTab,
      label: "Cerradas",
      hint: "Archivadas",
      description:
        "Conversaciones archivadas definitivamente. Si el cliente escribe en el futuro, se abrirá un caso nuevo.",
      badge: closedCount,
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
        <div className="flex rounded-lg bg-background border border-border p-0.5 gap-1 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <Tooltip key={tab.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onTabChange(tab.value)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge != null && tab.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : (tab.badgeColor ?? "bg-muted text-foreground")
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-[260px] p-2.5 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-foreground">{tab.label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {tab.hint}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {tab.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Botón de ayuda / glosario de estados */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Guía de estados de atención"
              title="Guía de estados de atención"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors shrink-0"
            >
              <Info className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 sm:w-96 p-4 text-xs space-y-3" align="start">
            <div className="space-y-1 border-b border-border pb-2">
              <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Info className="size-4 text-primary" />
                Guía de estados de la bandeja
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Cómo se clasifica cada conversación según su avance en la atención:
              </p>
            </div>
            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="font-bold text-foreground">Abiertas:</span>
                <span className="text-muted-foreground ml-1">
                  Todas las conversaciones activas que se encuentran en curso (atendidas por bot o
                  asesor).
                </span>
              </div>
              <div>
                <span className="font-bold text-amber-600 dark:text-amber-400">En cola:</span>
                <span className="text-muted-foreground ml-1">
                  Conversaciones que están esperando que un asesor humano las tome (sin asignar).
                </span>
              </div>
              <div>
                <span className="font-bold text-rose-600 dark:text-rose-400">Demoradas:</span>
                <span className="text-muted-foreground ml-1">
                  Clientes con mensajes sin responder o que han superado el tiempo límite de espera
                  (SLA).
                </span>
              </div>
              <div>
                <span className="font-bold text-sky-600 dark:text-sky-400">En espera:</span>
                <span className="text-muted-foreground ml-1">
                  Casos pausados esperando datos o comprobantes del cliente, o agendados para más
                  tarde.
                </span>
              </div>
              <div className="pt-2 border-t border-border/60">
                <p className="font-bold text-foreground mb-1">
                  Diferencia: ¿Resueltas vs. Cerradas?
                </p>
                <div className="space-y-1.5">
                  <div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Resuelta:
                    </span>
                    <span className="text-muted-foreground ml-1">
                      El asesor ya solucionó el problema. Si el cliente vuelve a escribir pronto con
                      una duda, se retoma el mismo caso sin empezar de cero.
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Cerrada:</span>
                    <span className="text-muted-foreground ml-1">
                      Caso finalizado definitivamente y archivado. Si el cliente escribe semanas
                      después, se abrirá una nueva atención desde el inicio.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
