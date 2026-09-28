export type TagItem = {
  id: string;
  name: string;
  color?: string; // hex code o preset name
  description?: string;
  createdAt: string;
  isSystem?: boolean;
};

export const COLOR_PALETTE = [
  { name: "Sin color", hex: "#64748b", bgCls: "bg-slate-500/15", textCls: "text-slate-600 dark:text-slate-400", borderCls: "border-slate-500/30" },
  { name: "Ámbar", hex: "#f59e0b", bgCls: "bg-amber-500/15", textCls: "text-amber-600 dark:text-amber-400", borderCls: "border-amber-500/30" },
  { name: "Azul", hex: "#3b82f6", bgCls: "bg-blue-500/15", textCls: "text-blue-600 dark:text-blue-400", borderCls: "border-blue-500/30" },
  { name: "Esmeralda", hex: "#10b981", bgCls: "bg-emerald-500/15", textCls: "text-emerald-600 dark:text-emerald-400", borderCls: "border-emerald-500/30" },
  { name: "Rojo", hex: "#ef4444", bgCls: "bg-danger/15", textCls: "text-danger", borderCls: "border-danger/30" },
  { name: "Morado", hex: "#8b5cf6", bgCls: "bg-purple-500/15", textCls: "text-purple-600 dark:text-purple-400", borderCls: "border-purple-500/30" },
  { name: "Rosa", hex: "#ec4899", bgCls: "bg-pink-500/15", textCls: "text-pink-600 dark:text-pink-400", borderCls: "border-pink-500/30" },
  { name: "Cian", hex: "#06b6d4", bgCls: "bg-cyan-500/15", textCls: "text-cyan-600 dark:text-cyan-400", borderCls: "border-cyan-500/30" },
];

export const INITIAL_SYSTEM_TAGS: TagItem[] = [
  { id: "tag-1", name: "AGENDADO", color: "#f59e0b", description: "Seguimiento estándar agendado", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-2", name: "POSPUESTO", color: "#64748b", description: "Postergado por el cliente", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-3", name: "MONITOREO", color: "#3b82f6", description: "En observación técnica de servicio", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-4", name: "REVISION_TECNICA", color: "#10b981", description: "Revisión en nodo/campo", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-5", name: "LLAMAR_LUEGO", color: "#8b5cf6", description: "Contactar en horario preferido", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-6", name: "PAGO_PENDIENTE", color: "#ef4444", description: "Esperando pago o comprobante", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-7", name: "CONFIRMACION_SERVICIO", color: "#06b6d4", description: "Validar calidad tras mantenimiento", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
];

export function getTagColorPreset(hexColor?: string) {
  if (!hexColor) return COLOR_PALETTE[0];
  const found = COLOR_PALETTE.find((c) => c.hex.toLowerCase() === hexColor.toLowerCase());
  return found ?? COLOR_PALETTE[0];
}
