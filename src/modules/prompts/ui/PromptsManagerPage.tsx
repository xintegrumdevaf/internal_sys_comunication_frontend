import { useState } from "react";
import {
  Sparkles,
  Bot,
  Search,
  X,
  History,
  Code2,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { usePrompts } from "../application/use-prompts";
import { PromptEditorSplitView } from "./PromptEditorSplitView";

export function PromptsManagerPage() {
  const hook = usePrompts();
  const {
    prompts,
    filteredPrompts,
    searchQuery,
    setSearchQuery,
    loadingPrompts,
    selectedSlug,
    selectPrompt,
    selectedPrompt,
  } = hook;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppShell title="Gestión de Prompts & Playground" icon={Sparkles}>
      <div className="space-y-4">
        {/* Layout Master-Detail: Barra lateral de plantillas (Master) + Panel de Edición/Simulación (Detail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* MASTER COLUMN: Lista Lateral de Plantillas (3 o 4 cols)         */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-3">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <h3 className="text-sm font-extrabold text-foreground">Catálogo de Prompts</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {prompts.length} disponibles
                </span>
              </div>

              {/* Buscador de Plantillas */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, slug o función..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Lista Vertical de Tarjetas Informativas */}
              <div className="space-y-2 max-h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto pr-1">
                {loadingPrompts ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <Sparkles className="size-6 mx-auto animate-pulse text-primary" />
                    <p>Cargando catálogo de prompts...</p>
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                    <Filter className="size-6 mx-auto text-muted-foreground/40 mb-1" />
                    <p className="font-semibold text-foreground">No se encontraron resultados</p>
                    <p>Intenta con otros términos de búsqueda.</p>
                  </div>
                ) : (
                  filteredPrompts.map((p) => {
                    const isSelected = p.slug === selectedSlug;
                    const activeVerNum = p.activeVersion?.versionNumber || 1;
                    const variablesCount = p.allowedVariables?.length || 0;

                    return (
                      <div
                        key={p.id || p.slug}
                        onClick={() => selectPrompt(p.slug)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs border-l-4 border-l-primary"
                            : "border-border bg-background/50 hover:bg-muted/30 hover:border-border/80"
                        }`}
                      >
                        {/* Nombre y Slug */}
                        <div className="space-y-0.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <h4
                              className={`text-xs font-bold leading-snug ${
                                isSelected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {p.name || p.slug}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0 border border-border">
                              v{activeVerNum}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground">{p.slug}</p>
                        </div>

                        {/* Descripción clara de lo que hace */}
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {p.description || "Plantilla de instrucción para el modelo de IA."}
                        </p>

                        {/* Metadatos y Variables */}
                        <div className="pt-1.5 border-t border-border/40 flex flex-wrap items-center justify-between text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                            <CheckCircle2 className="size-2.5" />
                            Activa
                          </span>

                          <span className="inline-flex items-center gap-1 font-mono">
                            <Code2 className="size-2.5 text-primary" />
                            {variablesCount} {variablesCount === 1 ? "variable" : "variables"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* DETAIL COLUMN: Editor & Playground de la Plantilla (8 o 9 cols) */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <PromptEditorSplitView hook={hook} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
