import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bold,
  CheckCheck,
  CheckCircle,
  Italic,
  Phone,
  Plus,
  Send,
  Smile,
  Strikethrough,
  Video,
  X,
} from "lucide-react";
import type {
  TemplateCategory,
  TemplateHeaderType,
  WabaConnectionDto,
} from "@/modules/message-templates/domain/message-template";
import {
  extractTemplateVariables,
  substituteTemplateVariables,
  validateMetaTemplateName,
  validateTemplateBody,
} from "@/modules/message-templates/domain/message-template";
import type { CreateMessageTemplatePayload } from "@/modules/message-templates/infrastructure/message-template.gateway";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMessageTemplatePayload) => Promise<boolean>;
  connections: WabaConnectionDto[];
  submitting: boolean;
};

const LANGUAGES = [
  { code: "pt_BR", label: "Português (BR)" },
  { code: "es_MX", label: "Español (México)" },
  { code: "es", label: "Español" },
  { code: "es_EC", label: "Español (Ecuador)" },
  { code: "en", label: "English" },
];

const POPULAR_EMOJIS = ["😊", "👍", "🚀", "🤝", "📢", "💬", "✅", "🎉", "🔥", "⚠️", "📦", "💳"];

export function MessageTemplateFormDialog({
  isOpen,
  onClose,
  onSubmit,
  connections,
  submitting,
}: Props) {
  const [category, setCategory] = useState<TemplateCategory>("MARKETING");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("pt_BR");
  const [connectionId, setConnectionId] = useState(connections[0]?.id || "");
  const [headerType, setHeaderType] = useState<TemplateHeaderType>("NONE");
  const [headerText, setHeaderText] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (
      isOpen &&
      connections.length > 0 &&
      (!connectionId || !connections.some((c) => c.id === connectionId))
    ) {
      setConnectionId(connections[0].id);
    }
  }, [isOpen, connections, connectionId]);

  // Detector y sustitución de variables
  const detectedVariables = useMemo(() => extractTemplateVariables(body), [body]);
  const renderedBodyPreview = useMemo(() => substituteTemplateVariables(body), [body]);

  // Validaciones
  const nameValidation = useMemo(() => validateMetaTemplateName(name), [name]);
  const bodyValidation = useMemo(() => validateTemplateBody(body), [body]);

  if (!isOpen) return null;

  const currentLanguageLabel = LANGUAGES.find((l) => l.code === language)?.label || language;
  const currentConnectionName =
    connections.find((c) => c.id === connectionId)?.name ||
    connections[0]?.name ||
    "Seleccione una conexión";

  // Inserción de variable en la posición del cursor
  const handleAddVariable = () => {
    const nextVarIndex = detectedVariables.length + 1;
    const varText = `{{${nextVarIndex}}}`;
    insertAtCursor(varText);
  };

  // Inserción de formato B/I/U o emoji
  const insertFormatting = (prefix: string, suffix = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => `${prev}${prefix}${suffix}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end);
    const replacement = `${prefix}${selected || "texto"}${suffix}`;
    const nextBody = body.slice(0, start) + replacement + body.slice(end);
    setBody(nextBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 5),
      );
    }, 0);
  };

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => `${prev}${textToInsert}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextBody = body.slice(0, start) + textToInsert + body.slice(end);
    setBody(nextBody);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + textToInsert.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValidation.valid || !bodyValidation.valid) return;

    const payload: CreateMessageTemplatePayload = {
      name,
      category,
      language,
      languageLabel: currentLanguageLabel,
      connectionId: connectionId || connections[0]?.id || "",
      header: headerType !== "NONE" ? { type: headerType, text: headerText } : undefined,
      body,
      footer: footer.trim() ? footer : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[#181f2a] border border-border/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-foreground">
        {/* Header Modal */}
        <div className="p-4 border-b border-border/60 bg-[#1e2736] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/20 text-primary grid place-items-center">
              <Send className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Crear plantilla</h3>
              <p className="text-[11px] text-muted-foreground">
                Crea una plantilla y envíala para aprobación de Meta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-white/10 grid place-items-center text-muted-foreground hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content columns (Form + Live Preview) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 p-5 space-y-4 border-r border-border/40 overflow-y-auto">
            {/* Categoría (Segmented control) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Categoría <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#131922] p-1 rounded-xl border border-border/50">
                {(["MARKETING", "UTILITY", "AUTHENTICATION"] as TemplateCategory[]).map((cat) => {
                  const labelMap = {
                    MARKETING: "Marketing",
                    UTILITY: "Utilidad",
                    AUTHENTICATION: "Autenticación",
                  };
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-md"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {labelMap[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nombre e Idioma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="pedido_confirmado"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/70 bg-[#111722] text-white font-mono focus:ring-2 focus:ring-primary outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">minúsculas, números y _</p>
                {!nameValidation.valid && name.length > 0 && (
                  <p className="text-[11px] text-rose-400 mt-0.5 flex items-center gap-1 font-semibold">
                    <AlertCircle className="size-3" /> {nameValidation.error}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Idioma <span className="text-rose-400">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/70 bg-[#111722] text-white font-medium focus:ring-2 focus:ring-primary outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conexión */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Conexión <span className="text-rose-400">*</span>
              </label>
              <select
                value={connectionId || connections[0]?.id || ""}
                onChange={(e) => setConnectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border/70 bg-[#111722] text-white font-medium focus:ring-2 focus:ring-primary outline-none cursor-pointer"
              >
                {connections.length === 0 && <option value="">Seleccione una conexión*</option>}
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} {conn.phoneNumber ? `(${conn.phoneNumber})` : ""}
                  </option>
                ))}
              </select>
              {connections.length === 1 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  ✓ Línea principal autoseleccionada.
                </p>
              )}
            </div>

            {/* Encabezado opcional */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Encabezado <span className="text-muted-foreground font-normal">· opcional</span>
              </label>
              <select
                value={headerType}
                onChange={(e) => setHeaderType(e.target.value as TemplateHeaderType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border/70 bg-[#111722] text-white font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="NONE">Ninguno</option>
                <option value="TEXT">Texto</option>
                <option value="IMAGE">Imagen</option>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Documento</option>
              </select>

              {headerType === "TEXT" && (
                <input
                  type="text"
                  placeholder="Escribe el texto del encabezado"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-border/70 bg-[#111722] text-white outline-none"
                />
              )}
            </div>

            {/* Cuerpo */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cuerpo <span className="text-rose-400">*</span>
              </label>
              <div className="rounded-xl border border-border/70 bg-[#111722] overflow-hidden">
                <textarea
                  ref={textareaRef}
                  rows={4}
                  maxLength={1024}
                  placeholder='Escribe tu mensaje. Toca "Agregar variable" para insertar campos como {{1}}, {{2}}...'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 text-xs font-sans text-slate-100 bg-transparent outline-none resize-none leading-relaxed placeholder:text-muted-foreground/60"
                />

                {/* Toolbar inferior */}
                <div className="px-3 py-2 bg-[#171f2c] border-t border-border/40 flex items-center justify-between relative">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Negrita (*texto*)"
                      onClick={() => insertFormatting("*")}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-300 font-bold"
                    >
                      <Bold className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Cursiva (_texto_)"
                      onClick={() => insertFormatting("_")}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-300 italic"
                    >
                      <Italic className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Tachado (~texto~)"
                      onClick={() => insertFormatting("~")}
                      className="p-1.5 rounded hover:bg-white/10 text-slate-300"
                    >
                      <Strikethrough className="size-3.5" />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        title="Emojis"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-300"
                      >
                        <Smile className="size-3.5" />
                      </button>

                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-1 bg-[#1e2736] border border-border rounded-xl p-2 shadow-xl grid grid-cols-6 gap-1 z-20">
                          {POPULAR_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                insertAtCursor(emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="size-7 grid place-items-center text-sm rounded hover:bg-white/10"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariable}
                      className="ml-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="size-3 text-primary" /> Agregar variable
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {body.length}/1024
                  </span>
                </div>
              </div>
            </div>

            {/* Pie opcional */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Pie <span className="text-muted-foreground font-normal">· opcional</span>
              </label>
              <input
                type="text"
                placeholder="Escribe el texto del pie de página"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border/70 bg-[#111722] text-white outline-none"
              />
            </div>
          </div>

          {/* Right Column: Live WhatsApp Preview (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#0e131b] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  👁 VISTA PREVIA
                </span>
              </div>

              {/* Chat Simulator Card */}
              <div className="rounded-2xl border border-white/10 bg-[#0b141a] overflow-hidden shadow-2xl">
                {/* WA Top Bar */}
                <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center gap-3 border-b border-white/5">
                  <div className="size-8 rounded-full bg-[#00a884] text-white grid place-items-center font-bold text-xs">
                    C
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      Contacto de ejemplo
                    </p>
                    <p className="text-[10px] text-[#8696a0]">en línea</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#8696a0]">
                    <Video className="size-4" />
                    <Phone className="size-4" />
                  </div>
                </div>

                {/* WA Chat Body */}
                <div
                  className="p-4 min-h-[260px] flex flex-col justify-end"
                  style={{
                    backgroundColor: "#0b141a",
                    backgroundImage:
                      "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                >
                  <div className="text-center my-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#182229] text-[9.5px] text-[#8696a0] uppercase tracking-wider font-semibold shadow-sm">
                      Hoy
                    </span>
                  </div>

                  {/* WA Bubble */}
                  <div className="max-w-[90%] self-end bg-[#005c4b] text-slate-100 rounded-xl rounded-tr-none p-3 shadow-md border border-emerald-400/20 text-xs space-y-1.5">
                    {headerType !== "NONE" && (
                      <div className="font-bold text-emerald-100 text-xs border-b border-emerald-400/20 pb-1">
                        {headerType === "TEXT"
                          ? headerText || "Encabezado"
                          : `[Encabezado de tipo ${headerType}]`}
                      </div>
                    )}

                    <div className="leading-relaxed whitespace-pre-wrap text-[12px] text-slate-50">
                      {renderedBodyPreview || (
                        <span className="italic text-emerald-200/50">
                          Tu mensaje aparecerá aquí.
                        </span>
                      )}
                    </div>

                    {footer && <div className="text-[10px] text-emerald-200/70">{footer}</div>}

                    <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-200/60 font-mono pt-0.5">
                      <span>11:40</span>
                      <CheckCheck className="size-3 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 leading-normal">
              Las variables aparecen como marcadores; el valor real se sustituye en el momento del
              envío.
            </p>
          </div>

          {/* Form Footer Buttons */}
          <div className="lg:col-span-12 p-4 border-t border-border/60 bg-[#1e2736] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !nameValidation.valid || !bodyValidation.valid}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-lg disabled:opacity-40 flex items-center gap-2 transition-all"
            >
              <Send className="size-3.5" /> Enviar para revisión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
