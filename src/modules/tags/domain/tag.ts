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
  {
    name: "Verde Esmeralda",
    hex: "#047857",
    bgCls: "bg-emerald-500/15 dark:bg-emerald-500/25",
    textCls: "text-emerald-700 dark:text-emerald-300",
    borderCls: "border-emerald-600/30 dark:border-emerald-500/40",
  },
  {
    name: "Azul Sky",
    hex: "#0284c7",
    bgCls: "bg-sky-500/15 dark:bg-sky-500/25",
    textCls: "text-sky-700 dark:text-sky-300",
    borderCls: "border-sky-600/30 dark:border-sky-500/40",
  },
  {
    name: "Verde Oliva",
    hex: "#65a30d",
    bgCls: "bg-lime-500/15 dark:bg-lime-500/25",
    textCls: "text-lime-800 dark:text-lime-300",
    borderCls: "border-lime-600/30 dark:border-lime-500/40",
  },
  {
    name: "Azul Rey",
    hex: "#3b82f6",
    bgCls: "bg-blue-500/15 dark:bg-blue-500/25",
    textCls: "text-blue-700 dark:text-blue-300",
    borderCls: "border-blue-600/30 dark:border-blue-500/40",
  },
  {
    name: "Púrpura",
    hex: "#8b5cf6",
    bgCls: "bg-purple-500/15 dark:bg-purple-500/25",
    textCls: "text-purple-700 dark:text-purple-300",
    borderCls: "border-purple-600/30 dark:border-purple-500/40",
  },
  {
    name: "Rojo Intenso",
    hex: "#ef4444",
    bgCls: "bg-red-500/15 dark:bg-red-500/25",
    textCls: "text-red-700 dark:text-red-300",
    borderCls: "border-red-600/30 dark:border-red-500/40",
  },
  {
    name: "Naranja Vívido",
    hex: "#f97316",
    bgCls: "bg-orange-500/15 dark:bg-orange-500/25",
    textCls: "text-orange-800 dark:text-orange-300",
    borderCls: "border-orange-600/30 dark:border-orange-500/40",
  },
  {
    name: "Ámbar Dorado",
    hex: "#d97706",
    bgCls: "bg-amber-500/15 dark:bg-amber-500/25",
    textCls: "text-amber-800 dark:text-amber-300",
    borderCls: "border-amber-600/30 dark:border-amber-500/40",
  },
  {
    name: "Amarillo Neón",
    hex: "#facc15",
    bgCls: "bg-yellow-400/20 dark:bg-yellow-400/25",
    textCls: "text-yellow-800 dark:text-yellow-300",
    borderCls: "border-yellow-500/40 dark:border-yellow-400/40",
  },
  {
    name: "Violeta Profundo",
    hex: "#9333ea",
    bgCls: "bg-purple-600/15 dark:bg-purple-600/25",
    textCls: "text-purple-800 dark:text-purple-300",
    borderCls: "border-purple-600/30 dark:border-purple-500/40",
  },
  {
    name: "Rosa Magenta",
    hex: "#ec4899",
    bgCls: "bg-pink-500/15 dark:bg-pink-500/25",
    textCls: "text-pink-700 dark:text-pink-300",
    borderCls: "border-pink-600/30 dark:border-pink-500/40",
  },
  {
    name: "Cian Turquesa",
    hex: "#06b6d4",
    bgCls: "bg-cyan-500/15 dark:bg-cyan-500/25",
    textCls: "text-cyan-800 dark:text-cyan-300",
    borderCls: "border-cyan-600/30 dark:border-cyan-500/40",
  },
  {
    name: "Lima Brillante",
    hex: "#84cc16",
    bgCls: "bg-lime-500/15 dark:bg-lime-500/25",
    textCls: "text-lime-800 dark:text-lime-300",
    borderCls: "border-lime-600/30 dark:border-lime-500/40",
  },
  {
    name: "Marrón Cálido",
    hex: "#78350f",
    bgCls: "bg-amber-900/20 dark:bg-amber-900/30",
    textCls: "text-amber-900 dark:text-amber-200",
    borderCls: "border-amber-800/40 dark:border-amber-700/40",
  },
  {
    name: "Gris Pizarra",
    hex: "#64748b",
    bgCls: "bg-slate-500/15 dark:bg-slate-500/25",
    textCls: "text-slate-700 dark:text-slate-200",
    borderCls: "border-slate-500/30 dark:border-slate-400/40",
  },
  {
    name: "Gris Oscuro",
    hex: "#475569",
    bgCls: "bg-slate-700/20 dark:bg-slate-700/30",
    textCls: "text-slate-800 dark:text-slate-200",
    borderCls: "border-slate-600/30 dark:border-slate-500/40",
  },
];

export const COLOR_PALETTE = COLOR_SWATCHES;

const NAMED_HEX_MAP: Record<string, string> = {
  ambar: "#d97706",
  amber: "#d97706",
  azul: "#0284c7",
  blue: "#0284c7",
  sky: "#0284c7",
  esmeralda: "#047857",
  emerald: "#047857",
  verde: "#047857",
  green: "#047857",
  oliva: "#65a30d",
  lime: "#84cc16",
  morado: "#8b5cf6",
  purpura: "#8b5cf6",
  purple: "#8b5cf6",
  violeta: "#9333ea",
  rojo: "#ef4444",
  red: "#ef4444",
  cian: "#06b6d4",
  cyan: "#06b6d4",
  naranja: "#f97316",
  orange: "#f97316",
  amarillo: "#facc15",
  yellow: "#facc15",
  rosa: "#ec4899",
  pink: "#ec4899",
  marron: "#78350f",
  brown: "#78350f",
  gris: "#64748b",
  gray: "#64748b",
  pizarra: "#64748b",
};

/**
 * Resuelve cualquier color (nombre en español/inglés o código hex) a un código hexadecimal válido y seguro.
 */
export function resolveTagHex(color?: string | null): string {
  if (!color) return "#64748b";
  const lower = color.trim().toLowerCase();
  if (lower === "#ffffff4d" || lower === "#ffffff" || lower === "transparent") {
    return "#64748b";
  }
  if (NAMED_HEX_MAP[lower]) return NAMED_HEX_MAP[lower];
  if (lower.startsWith("#")) return lower;
  return `#${lower}`;
}

export const INITIAL_SYSTEM_TAGS: TagItem[] = [
  {
    id: "tag-1",
    name: "AGENDADO",
    color: "#d97706",
    description: "Seguimiento estándar agendado",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
  {
    id: "tag-2",
    name: "POSPUESTO",
    color: "#64748b",
    description: "Postergado por el cliente",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
  {
    id: "tag-3",
    name: "MONITOREO",
    color: "#0284c7",
    description: "En observación técnica de servicio",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
  {
    id: "tag-4",
    name: "REVISION_TECNICA",
    color: "#047857",
    description: "Revisión en nodo/campo",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
  {
    id: "tag-5",
    name: "LLAMAR_LUEGO",
    color: "#8b5cf6",
    description: "Contactar en horario preferido",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
  {
    id: "tag-6",
    name: "PAGO_PENDIENTE",
    color: "#ef4444",
    description: "Esperando pago o comprobante",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
  {
    id: "tag-7",
    name: "CONFIRMACION_SERVICIO",
    color: "#06b6d4",
    description: "Validar calidad tras mantenimiento",
    createdAt: "2026-09-01T10:00:00.000Z",
    isSystem: true,
  },
];

export function getTagColorPreset(hexColor?: string): ColorPreset {
  const hex = resolveTagHex(hexColor);
  const found = COLOR_SWATCHES.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (found) return found;

  return {
    name: hex.toUpperCase(),
    hex,
    bgCls: "bg-slate-100 dark:bg-slate-800/80",
    textCls: "text-slate-900 dark:text-slate-100 font-semibold",
    borderCls: "border-slate-300 dark:border-slate-700",
    customStyle: {
      borderColor: `${hex.slice(0, 7)}80`,
      backgroundColor: `${hex.slice(0, 7)}20`,
    },
  };
}
