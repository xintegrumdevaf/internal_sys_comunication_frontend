import { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Compass,
  Layers,
  FileCheck,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Zap,
  Globe,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  coverageApi,
  type CoverageZoneDto,
  type CoverageCheckResultDto,
} from "../infrastructure/coverage.api";
import { toast } from "sonner";

export function CoverageSettingsCard() {
  const [zones, setZones] = useState<CoverageZoneDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [showGuide, setShowGuide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Probador interactivo de cobertura
  const [testInput, setTestInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<CoverageCheckResultDto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await coverageApi.getZones();
      setZones(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar las zonas";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadZones();
  }, []);

  const processFile = async (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".kml") && !ext.endsWith(".kmz")) {
      toast.error("Por favor selecciona un archivo con extensión .kml o .kmz");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Importando mapa de cobertura desde ${file.name}...`);

    try {
      const result = await coverageApi.importKmlFile(file);
      toast.success(result.message || "Mapa de cobertura importado exitosamente", {
        id: toastId,
      });
      await loadZones();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al procesar el archivo KML/KMZ";
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleReloadMemory = async () => {
    setReloading(true);
    try {
      const res = await coverageApi.reloadMemory();
      toast.success(`Memoria recargada: ${res.activeZonesCount} zonas de cobertura activas`);
      await loadZones();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al recargar zonas en memoria";
      toast.error(message);
    } finally {
      setReloading(false);
    }
  };

  const handleRunTest = async (overrideValue?: string) => {
    const query = (overrideValue ?? testInput).trim();
    if (!query) {
      toast.error("Ingresa coordenadas, dirección o enlace de Google Maps");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const coordMatch = query.match(/([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/);
      let payload: { lat?: number; lng?: number; address?: string; locationUrl?: string } = {};

      if (coordMatch?.[1] && coordMatch[2]) {
        payload = {
          lat: Number.parseFloat(coordMatch[1]),
          lng: Number.parseFloat(coordMatch[2]),
        };
      } else if (query.startsWith("http://") || query.startsWith("https://")) {
        payload = { locationUrl: query };
      } else {
        payload = { address: query };
      }

      const result = await coverageApi.checkLocation(payload);
      setTestResult(result);

      if (result.hasCoverage) {
        toast.success(`¡Factibilidad aprobada en ${result.zoneName} (${result.city})!`);
      } else {
        toast.info("Ubicación fuera de la zona de cobertura actual");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al consultar cobertura";
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const z of zones) {
      if (z.city) set.add(z.city);
    }
    return Array.from(set);
  }, [zones]);

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const matchesSearch =
        z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (z.folder && z.folder.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity =
        selectedCity === "all" || z.city?.toLowerCase() === selectedCity.toLowerCase();
      return matchesSearch && matchesCity;
    });
  }, [zones, searchTerm, selectedCity]);

  return (
    <div className="space-y-6">
      {/* Input oculto para carga de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml,.kmz"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Card Principal de Control */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                <CardTitle className="text-xl">Zonas de Cobertura y Factibilidad (KML / KMZ)</CardTitle>
                <Badge variant="outline" className="text-xs">
                  Flujo de Ventas WhatsApp
                </Badge>
              </div>
              <CardDescription className="text-sm mt-1">
                Administra los polígonos de tu red de fibra óptica. Cuando un cliente comparta su ubicación en WhatsApp,
                el sistema verificará automáticamente en menos de un segundo si tienes factibilidad técnica para venderle.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadMemory}
                disabled={reloading || loading}
                className="gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${reloading ? "animate-spin" : ""}`} />
                {reloading ? "Recargando..." : "Recargar Memoria"}
              </Button>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Upload className="size-3.5" />
                {uploading ? "Subiendo..." : "Subir Archivo KML / KMZ"}
              </Button>
            </div>
          </div>

          {/* Métricas Visuales Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Sectores Activos</p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">{zones.length}</p>
                <span className="text-[10px] text-muted-foreground">Polígonos indexados</span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Layers className="size-6" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Ciudades Cubiertas</p>
                <p className="text-lg font-bold mt-0.5 text-foreground truncate max-w-[170px]" title={cities.join(", ")}>
                  {cities.length > 0 ? cities.join(", ") : "Sin definir"}
                </p>
                <span className="text-[10px] text-muted-foreground">{cities.length} ciudad(es) registradas</span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-6" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Velocidad de Verificación</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Zap className="size-4" /> &lt; 1 ms (Instantáneo)
                </p>
                <span className="text-[10px] text-muted-foreground">Motor geométrico en memoria RAM</span>
              </div>
              <Badge variant="secondary" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                100% Activo
              </Badge>
            </div>
          </div>

          {/* Guía de Ayuda Desplegable */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              <HelpCircle className="size-3.5" />
              {showGuide
                ? "Ocultar guía para exportar mapas"
                : "¿Cómo exportar tus zonas desde Google Earth o My Maps en 3 clics?"}
              {showGuide ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {showGuide && (
              <div className="mt-3 p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-3">
                <p className="font-semibold text-foreground">
                  Pasos sencillos para actualizar la cobertura de tu red:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                  <li>
                    Abre tu mapa en <strong>Google Earth Pro</strong> o <strong>Google My Maps</strong> donde tengas dibujados los polígonos de tus sectores de fibra.
                  </li>
                  <li>
                    Haz clic derecho sobre la carpeta de sectores o el mapa completo y selecciona{" "}
                    <strong>"Guardar lugar como..."</strong> (Save Place As...).
                  </li>
                  <li>
                    Selecciona formato <strong>KML</strong> o <strong>KMZ</strong> y guarda el archivo en tu equipo.
                  </li>
                  <li>
                    Arrastra el archivo a la caja punteada de abajo o presiona el botón <strong>"Subir Archivo KML / KMZ"</strong>.
                  </li>
                  <li>
                    ¡Listo! El sistema reconocerá automáticamente los nombres de cada barrio, sector y ciudad para asignarlos al flujo de ventas.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Zona Drag & Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-border hover:border-primary/60 hover:bg-muted/30 bg-muted/10"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Globe className="size-6" />
              </div>
              <h4 className="font-semibold text-sm">
                Arrastra tu archivo .kml o .kmz aquí o haz clic para seleccionarlo
              </h4>
              <p className="text-xs text-muted-foreground max-w-md">
                Soporta mapas exportados desde Google Earth, Google My Maps y QGIS con carpetas por ciudad y nombres de sectores.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] bg-background">
                  .KML
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-background">
                  .KMZ (Comprimido)
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-background">
                  Hasta 25 MB
                </Badge>
              </div>
            </div>
          </div>

          {/* Probador Interactivo / Radar de Cobertura */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <h4 className="font-semibold text-sm">Radar y Verificador de Factibilidad en Vivo</h4>
              </div>
              <Badge variant="outline" className="text-[10px] bg-background">
                Simulador de Clientes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Comprueba en tiempo real si una dirección, coordenadas o link de WhatsApp cae dentro de tu cobertura:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: -0.2781, -78.5581 o 'Chillogallo' o 'https://maps.app.goo.gl/...'"
                  className="pl-9 bg-background text-xs"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleRunTest();
                  }}
                />
              </div>
              <Button
                onClick={() => handleRunTest()}
                disabled={testing || !testInput.trim()}
                className="gap-2 text-xs shrink-0 cursor-pointer"
              >
                {testing ? <RefreshCw className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                Verificar Cobertura
              </Button>
            </div>

            {/* Atajos de prueba rápida */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-medium">Pruebas rápidas:</span>
              <button
                type="button"
                onClick={() => {
                  setTestInput("-0.275, -78.555");
                  void handleRunTest("-0.275, -78.555");
                }}
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
              >
                📍 Chillogallo (Quito)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestInput("-2.895, -79.005");
                  void handleRunTest("-2.895, -79.005");
                }}
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
              >
                📍 El Sagrario (Cuenca)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestInput("-0.200, -78.485");
                  void handleRunTest("-0.200, -78.485");
                }}
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
              >
                📍 La Floresta (Quito)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestInput("-0.150, -78.300");
                  void handleRunTest("-0.150, -78.300");
                }}
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border text-foreground transition-colors cursor-pointer text-muted-foreground"
              >
                ❌ Fuera de Rango (Prueba Negativa)
              </button>
            </div>

            {/* Resultado de la Verificación */}
            {testResult && (
              <div className="mt-3 p-4 rounded-xl border bg-background space-y-3 animate-in fade-in">
                {testResult.hasCoverage ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <div>
                          <h5 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                            ¡Factibilidad Técnica Confirmada!
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            El cliente se encuentra dentro del polígono de servicio.
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-xs">
                        {testResult.city || "Ciudad Cubierta"}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Sector / Barrio:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {testResult.zoneName}
                        </span>
                      </div>
                      {testResult.queryCoordinates && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Coordenadas Validadas:</span>
                          <span className="font-mono">
                            {testResult.queryCoordinates.lat.toFixed(5)}, {testResult.queryCoordinates.lng.toFixed(5)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded bg-muted/40 border border-border/60 text-xs">
                      <span className="text-[10px] font-bold text-primary uppercase block mb-1">
                        Respuesta automática de WhatsApp que recibirá el prospecto:
                      </span>
                      <p className="text-foreground italic">
                        "¡Buenas noticias! Confirmamos que contamos con cobertura de fibra óptica en tu sector ({testResult.zoneName}). En este momento te transferimos con un especialista en ventas para coordinar tu plan e instalación."
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="size-5 text-rose-500" />
                        <div>
                          <h5 className="font-bold text-sm text-rose-700 dark:text-rose-400">
                            Ubicación Fuera de Cobertura
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            {testResult.reason || "Las coordenadas no coinciden con ningún polígono activo en el archivo KML."}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-rose-600 dark:text-rose-400 text-xs">
                        No Disponible
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded bg-muted/40 border border-border/60 text-xs">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Respuesta automática de WhatsApp:
                      </span>
                      <p className="text-muted-foreground italic">
                        "Por el momento lamentamos informarte que aún no contamos con cobertura de fibra óptica en tu zona. Hemos guardado tus datos para notificarte apenas expandamos nuestra red a tu sector."
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Explorador de Sectores y Filtros por Ciudad */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  <Layers className="size-4 text-primary" /> Sectores y Polígonos Registrados
                </h4>
                <p className="text-xs text-muted-foreground">
                  Filtra por ciudad o busca por nombre de barrio para inspeccionar las zonas operativas.
                </p>
              </div>

              {/* Buscador */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar sector o barrio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>

            {/* Chips de Ciudades */}
            {cities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCity("all")}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    selectedCity === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  Todas las Ciudades ({zones.length})
                </button>
                {cities.map((city) => {
                  const count = zones.filter((z) => z.city?.toLowerCase() === city.toLowerCase()).length;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        selectedCity === city
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 hover:bg-muted text-foreground border-border"
                      }`}
                    >
                      {city} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Listado de Zonas */}
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                Cargando zonas de cobertura...
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                <MapPin className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                {zones.length === 0
                  ? "No hay zonas de cobertura registradas. Sube un archivo .kml o .kmz arriba para comenzar."
                  : "No se encontraron sectores que coincidan con la búsqueda."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1">
                {filteredZones.map((zone, idx) => (
                  <div
                    key={`${zone.name}-${idx}`}
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs truncate max-w-[180px]" title={zone.name}>
                          {zone.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0">
                          {zone.city || "Sin ciudad"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {zone.folder ? `Carpeta: ${zone.folder}` : "Sector perimetral"}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{zone.pointsCount} vértices</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTestInput(`${zone.center.lat.toFixed(5)}, ${zone.center.lng.toFixed(5)}`);
                          void handleRunTest(`${zone.center.lat.toFixed(5)}, ${zone.center.lng.toFixed(5)}`);
                        }}
                        className="text-primary hover:underline font-medium cursor-pointer"
                      >
                        Probar centro ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
