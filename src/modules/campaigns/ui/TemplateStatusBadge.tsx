import type { TemplateStatus } from "../domain/template";

type Props = {
  status: TemplateStatus;
  className?: string;
};

const STATUS_CONFIG: Record<
  TemplateStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  pending: {
    label: "Pendiente revisión",
    bg: "bg-warning/15",
    text: "text-warning-foreground text-amber-500",
    ring: "ring-amber-500/30",
  },
  approved: {
    label: "Aprobada Meta",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500 font-bold",
    ring: "ring-emerald-500/30",
  },
  rejected: {
    label: "Rechazada",
    bg: "bg-danger/15",
    text: "text-danger font-bold",
    ring: "ring-danger/30",
  },
  paused: {
    label: "Pausada",
    bg: "bg-muted/40",
    text: "text-muted-foreground",
    ring: "ring-border",
  },
  draft: {
    label: "Borrador local",
    bg: "bg-sky-500/15",
    text: "text-sky-400 font-bold",
    ring: "ring-sky-500/30",
  },
};

export function TemplateStatusBadge({ status, className = "" }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono tracking-wide ring-1 font-semibold uppercase ${config.bg} ${config.text} ${config.ring} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current shrink-0 animate-pulse" />
      {config.label}
    </span>
  );
}
