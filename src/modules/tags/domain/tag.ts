export type TagItem = {
  id: string;
  name: string;
  color?: string; // hex code
  description?: string;
  createdAt: string;
  isSystem?: boolean;
};

export type ColorPreset = {
  name: string;
  hex: string;
  bgCls?: string;
  textCls?: string;
  borderCls?: string;
  customStyle?: React.CSSProperties;
};

export const COLOR_SWATCHES: ColorPreset[] = [
  { name: "Verde Esmeralda", hex: "#047857", bgCls: "bg-emerald-600/15", textCls: "text-emerald-500", borderCls: "border-emerald-500/30" },
  { name: "Azul Sky", hex: "#0284c7", bgCls: "bg-sky-500/15", textCls: "text-sky-500", borderCls: "border-sky-500/30" },
  { name: "Verde Oliva", hex: "#65a30d", bgCls: "bg-lime-600/15", textCls: "text-lime-500", borderCls: "border-lime-500/30" },
  { name: "Azul Rey", hex: "#3b82f6", bgCls: "bg-blue-500/15", textCls: "text-blue-500", borderCls: "border-blue-500/30" },
  { name: "Púrpura", hex: "#8b5cf6", bgCls: "bg-purple-500/15", textCls: "text-purple-500", borderCls: "border-purple-500/30" },
  { name: "Rojo Intenso", hex: "#ef4444", bgCls: "bg-red-500/15", textCls: "text-red-500", borderCls: "border-red-500/30" },
  { name: "Naranja Vívido", hex: "#f97316", bgCls: "bg-orange-500/15", textCls: "text-orange-500", borderCls: "border-orange-500/30" },
  { name: "Ámbar Dorado", hex: "#d97706", bgCls: "bg-amber-600/15", textCls: "text-amber-500", borderCls: "border-amber-500/30" },

  { name: "Amarillo Neón", hex: "#facc15", bgCls: "bg-yellow-400/15", textCls: "text-yellow-500", borderCls: "border-yellow-400/30" },
  { name: "Violeta Profundo", hex: "#9333ea", bgCls: "bg-purple-600/15", textCls: "text-purple-400", borderCls: "border-purple-600/30" },
  { name: "Rosa Magenta", hex: "#ec4899", bgCls: "bg-pink-500/15", textCls: "text-pink-500", borderCls: "border-pink-500/30" },
  { name: "Cian Turquesa", hex: "#06b6d4", bgCls: "bg-cyan-500/15", textCls: "text-cyan-500", borderCls: "border-cyan-500/30" },
  { name: "Lima Brillante", hex: "#84cc16", bgCls: "bg-lime-500/15", textCls: "text-lime-400", borderCls: "border-lime-500/30" },
  { name: "Marrón Cálido", hex: "#78350f", bgCls: "bg-amber-900/20", textCls: "text-amber-700 dark:text-amber-400", borderCls: "border-amber-800/30" },
  { name: "Gris Pizarra", hex: "#64748b", bgCls: "bg-slate-500/15", textCls: "text-slate-400", borderCls: "border-slate-500/30" },
  { name: "Gris Oscuro", hex: "#475569", bgCls: "bg-slate-700/20", textCls: "text-slate-300", borderCls: "border-slate-600/30" },
];

export const COLOR_PALETTE = COLOR_SWATCHES;

export const INITIAL_SYSTEM_TAGS: TagItem[] = [
  { id: "tag-1", name: "AGENDADO", color: "#d97706", description: "Seguimiento estándar agendado", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-2", name: "POSPUESTO", color: "#64748b", description: "Postergado por el cliente", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-3", name: "MONITOREO", color: "#3b82f6", description: "En observación técnica de servicio", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-4", name: "REVISION_TECNICA", color: "#047857", description: "Revisión en nodo/campo", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-5", name: "LLAMAR_LUEGO", color: "#8b5cf6", description: "Contactar en horario preferido", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-6", name: "PAGO_PENDIENTE", color: "#ef4444", description: "Esperando pago o comprobante", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
  { id: "tag-7", name: "CONFIRMACION_SERVICIO", color: "#06b6d4", description: "Validar calidad tras mantenimiento", createdAt: "2026-09-01T10:00:00.000Z", isSystem: true },
];

export function getTagColorPreset(hexColor?: string): ColorPreset {
  if (!hexColor) {
    return {
      name: "#FFFFFF4D",
      hex: "#ffffff4d",
      bgCls: "bg-slate-500/15",
      textCls: "text-slate-300",
      borderCls: "border-slate-500/30",
      customStyle: {
        backgroundColor: "#ffffff4d",
        color: "#ffffff",
        borderColor: "#ffffff4d",
      },
    };
  }
  const found = COLOR_SWATCHES.find((c) => c.hex.toLowerCase() === hexColor.toLowerCase());
  if (found) return found;

  const validHex = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;
  return {
    name: validHex.toUpperCase(),
    hex: validHex,
    bgCls: "",
    textCls: "",
    borderCls: "",
    customStyle: {
      backgroundColor: validHex.length >= 7 ? `${validHex.slice(0, 7)}20` : validHex,
      color: validHex.length >= 7 ? validHex.slice(0, 7) : "#ffffff",
      borderColor: validHex.length >= 7 ? `${validHex.slice(0, 7)}40` : validHex,
    },
  };
}

