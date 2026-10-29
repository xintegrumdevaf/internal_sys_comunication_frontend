import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import {
  Server,
  Network,
  Activity,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Layers,
  HardDrive,
  Eye,
  EyeOff,
  Upload,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsApi } from "../infrastructure/settings.api";
import type {
  NetworkRouterConfig,
  NetworkOltConfig,
  OltBrand,
  TestNetworkConnectionResult,
} from "../domain/settings.types";
import { toast } from "sonner";

export function NetworkSettingsCard() {
  const [routers, setRouters] = useState<NetworkRouterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingRouterId, setTestingRouterId] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<
    Record<string, TestNetworkConnectionResult>
  >({});
  const [testingOltId, setTestingOltId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [loadingPassId, setLoadingPassId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    try {
      setImporting(true);
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        toast.error("El archivo seleccionado no es un JSON válido");
        return;
      }

      const res = await settingsApi.importNetworkTopology(json);
      toast.success(res.message || "Topología importada exitosamente");
      await loadRouters();
    } catch (err) {
      toast.error("Error al importar topología", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await settingsApi.exportNetworkTopology();
      const exportData = res.data || res;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `network-topology-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Topología exportada exitosamente");
    } catch (err) {
      toast.error("Error al exportar topología", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setExporting(false);
    }
  };

  const toggleRevealRouterPassword = async (routerId: string) => {
    if (revealedPasswords[routerId]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[routerId];
        return next;
      });
      return;
    }
    try {
      setLoadingPassId(routerId);
      const pass = await settingsApi.getRouterPassword(routerId);
      setRevealedPasswords((prev) => ({ ...prev, [routerId]: pass }));
    } catch {
      toast.error("Error al obtener la contraseña del router");
    } finally {
      setLoadingPassId(null);
    }
  };

  const toggleRevealOltPassword = async (routerId: string, oltId: string) => {
    if (revealedPasswords[oltId]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[oltId];
        return next;
      });
      return;
    }
    try {
      setLoadingPassId(oltId);
      const pass = await settingsApi.getOltPassword(routerId, oltId);
      setRevealedPasswords((prev) => ({ ...prev, [oltId]: pass }));
    } catch {
      toast.error("Error al obtener la contraseña de la OLT");
    } finally {
      setLoadingPassId(null);
    }
  };

  const handleToggleRouterModalPass = async () => {
    if (!showPassword && editingRouter && !routerForm.password) {
      try {
        const pass = await settingsApi.getRouterPassword(editingRouter.id);
        setRouterForm((prev) => ({ ...prev, password: pass }));
      } catch {
        // ignore
      }
    }
    setShowPassword((prev) => !prev);
  };

  const handleToggleOltModalPass = async () => {
    if (!showPassword && editingOlt && selectedRouterForOlt && !oltForm.password) {
      try {
        const pass = await settingsApi.getOltPassword(selectedRouterForOlt.id, editingOlt.id);
        setOltForm((prev) => ({ ...prev, password: pass }));
      } catch {
        // ignore
      }
    }
    setShowPassword((prev) => !prev);
  };
  const [oltResults, setOltResults] = useState<Record<string, TestNetworkConnectionResult>>({});

  // Modales
  const [routerModalOpen, setRouterModalOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<NetworkRouterConfig | null>(null);
  const [routerForm, setRouterForm] = useState({
    name: "",
    displayName: "",
    host: "",
    port: 8322,
    username: "ANGEL",
    password: "",
  });

  const [oltModalOpen, setOltModalOpen] = useState(false);
  const [selectedRouterForOlt, setSelectedRouterForOlt] = useState<NetworkRouterConfig | null>(
    null,
  );
  const [editingOlt, setEditingOlt] = useState<NetworkOltConfig | null>(null);
  const [oltForm, setOltForm] = useState({
    name: "",
    displayName: "",
    ip: "",
    brand: "huawei" as OltBrand,
    username: "admin",
    password: "",
    slot: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRouters = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.listNetworkRouters();
      setRouters(data || []);
    } catch (err) {
      toast.error("Error al cargar la infraestructura de red", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouters();
  }, []);

  const handleTestOlt = async (router: NetworkRouterConfig, olt: NetworkOltConfig) => {
    try {
      setTestingOltId(olt.id);
      const res = await settingsApi.testNetworkConnection({
        type: "olt",
        host: router.host,
        ip: olt.ip,
        port: router.port,
        username: router.username,
        routerId: router.id,
        routerName: router.name,
        oltId: olt.id,
        oltName: olt.name,
      });
      setOltResults((prev) => ({ ...prev, [olt.id]: res }));
      if (res.success) {
        toast.success(`Autenticación exitosa con ${olt.displayName || olt.name}`, {
          description: `Latencia: ${res.latencyMs}ms`,
        });
      } else {
        toast.error(`Fallo de autenticación en ${olt.displayName || olt.name}`, {
          description: res.error || res.message,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error probando autenticación de OLT";
      setOltResults((prev) => ({
        ...prev,
        [olt.id]: { success: false, latencyMs: 0, message: "Error", error: msg },
      }));
      toast.error(msg);
    } finally {
      setTestingOltId(null);
    }
  };

  const handleTestConnection = async (router: NetworkRouterConfig) => {
    try {
      setTestingRouterId(router.id);
      const res = await settingsApi.testNetworkConnection({
        type: "router",
        host: router.host,
        ip: router.host,
        port: router.port,
        username: router.username,
        routerId: router.id,
        routerName: router.name,
        validateOlts: true,
      });
      setConnectionResults((prev) => ({ ...prev, [router.id]: res }));

      // Sincronizar estado de las OLTs hijas en caso de que vengan en el detalle
      if (res.details?.olts) {
        setOltResults((prev) => {
          const updated = { ...prev };
          for (const o of res.details!.olts!) {
            updated[o.id] = {
              success: o.success,
              latencyMs: o.latencyMs,
              message: o.success ? "Autenticación exitosa" : "Fallo de autenticación",
              error: o.error,
            };
          }
          return updated;
        });
      }

      if (res.success) {
        toast.success(`Conexión y autenticación exitosas con ${router.displayName}`, {
          description: res.message || `Latencia: ${res.latencyMs}ms`,
        });
      } else {
        toast.error(`Fallo en ${router.displayName}`, {
          description: res.error || res.message,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error probando conexión";
      setConnectionResults((prev) => ({
        ...prev,
        [router.id]: { success: false, latencyMs: 0, message: "Error", error: msg },
      }));
      toast.error(msg);
    } finally {
      setTestingRouterId(null);
    }
  };

  // Abrir modal de Router (crear o editar)
  const openRouterModal = (router?: NetworkRouterConfig) => {
    if (router) {
      setEditingRouter(router);
      setRouterForm({
        name: router.name,
        displayName: router.displayName,
        host: router.host,
        port: router.port,
        username: router.username,
        password: "",
      });
    } else {
      setEditingRouter(null);
      setRouterForm({
        name: "",
        displayName: "",
        host: "",
        port: 8322,
        username: "ANGEL",
        password: "",
      });
    }
    setShowPassword(false);
    setRouterModalOpen(true);
  };

  const handleSaveRouter = async () => {
    if (!routerForm.name.trim() || !routerForm.displayName.trim() || !routerForm.host.trim()) {
      toast.error("Nombre, nombre legible y host son requeridos");
      return;
    }
    if (!editingRouter && !routerForm.password.trim()) {
      toast.error("La contraseña es requerida para un nuevo router");
      return;
    }

    try {
      setSaving(true);
      if (editingRouter) {
        await settingsApi.updateNetworkRouter(editingRouter.id, {
          displayName: routerForm.displayName,
          host: routerForm.host,
          port: Number(routerForm.port) || 8322,
          username: routerForm.username,
          ...(routerForm.password.trim() ? { password: routerForm.password.trim() } : {}),
        });
        toast.success("Router actualizado exitosamente");
      } else {
        await settingsApi.createNetworkRouter({
          name: routerForm.name.trim().toLowerCase(),
          displayName: routerForm.displayName.trim(),
          host: routerForm.host.trim(),
          port: Number(routerForm.port) || 8322,
          username: routerForm.username.trim(),
          password: routerForm.password.trim(),
        });
        toast.success("Nuevo router registrado exitosamente");
      }
      setRouterModalOpen(false);
      loadRouters();
    } catch (err) {
      toast.error("Error al guardar router", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRouter = async (router: NetworkRouterConfig) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el router '${router.displayName}' y todas sus OLTs asociadas?`,
      )
    ) {
      return;
    }
    try {
      await settingsApi.deleteNetworkRouter(router.id);
      toast.success("Router eliminado");
      loadRouters();
    } catch (err) {
      toast.error("Error al eliminar router", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Abrir modal de OLT (crear o editar)
  const openOltModal = (router: NetworkRouterConfig, olt?: NetworkOltConfig) => {
    setSelectedRouterForOlt(router);
    if (olt) {
      setEditingOlt(olt);
      setOltForm({
        name: olt.name,
        displayName: olt.displayName,
        ip: olt.ip,
        brand: olt.brand,
        username: olt.username,
        password: "",
        slot: olt.slot || "",
      });
    } else {
      setEditingOlt(null);
      setOltForm({
        name: "",
        displayName: "",
        ip: "172.40.0.",
        brand: "huawei",
        username: "admin",
        password: "",
        slot: "",
      });
    }
    setShowPassword(false);
    setOltModalOpen(true);
  };

  const handleSaveOlt = async () => {
    if (!selectedRouterForOlt) return;
    if (!oltForm.name.trim() || !oltForm.ip.trim()) {
      toast.error("Nombre e IP de la OLT son requeridos");
      return;
    }
    if (!editingOlt && !oltForm.password.trim()) {
      toast.error("La contraseña es requerida para una nueva OLT");
      return;
    }

    try {
      setSaving(true);
      if (editingOlt) {
        await settingsApi.updateNetworkOlt(selectedRouterForOlt.id, editingOlt.id, {
          displayName: oltForm.displayName.trim() || undefined,
          ip: oltForm.ip.trim(),
          brand: oltForm.brand,
          username: oltForm.username.trim(),
          slot: oltForm.slot.trim() || undefined,
          ...(oltForm.password.trim() ? { password: oltForm.password.trim() } : {}),
        });
        toast.success("OLT actualizada exitosamente");
      } else {
        await settingsApi.createNetworkOlt(selectedRouterForOlt.id, {
          name: oltForm.name.trim(),
          displayName: oltForm.displayName.trim() || undefined,
          ip: oltForm.ip.trim(),
          brand: oltForm.brand,
          username: oltForm.username.trim(),
          password: oltForm.password.trim(),
          slot: oltForm.slot.trim() || undefined,
        });
        toast.success("OLT agregada exitosamente");
      }
      setOltModalOpen(false);
      loadRouters();
    } catch (err) {
      toast.error("Error al guardar OLT", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOlt = async (routerId: string, olt: NetworkOltConfig) => {
    if (!confirm(`¿Eliminar la OLT '${olt.displayName}'?`)) return;
    try {
      await settingsApi.deleteNetworkOlt(routerId, olt.id);
      toast.success("OLT eliminada");
      loadRouters();
    } catch (err) {
      toast.error("Error al eliminar OLT", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const getBrandBadge = (brand: string) => {
    switch (brand) {
      case "huawei":
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
            HUAWEI
          </Badge>
        );
      case "v-sol":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            V-SOL
          </Badge>
        );
      case "c-data":
        return (
          <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800">
            C-DATA
          </Badge>
        );
      case "kingtype":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            KINGTYPE
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800">
            {brand.toUpperCase()}
          </Badge>
        );
    }
  };

  const totalOlts = routers.reduce((acc, r) => acc + (r.olts?.length || 0), 0);

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Server className="size-5" />
            </div>
            <CardTitle className="text-xl">Infraestructura de Red: Routers y OLTs</CardTitle>
          </div>
          <CardDescription className="mt-1 text-sm text-muted-foreground">
            Topología técnica de routers de borde (MikroTik) y cabeceras ópticas (OLTs). Las
            credenciales están protegidas con cifrado en reposo AES-256-GCM.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || loading}
            className="gap-2"
            title="Exportar respaldo de la topología en JSON"
          >
            <Download className={`size-4 ${exporting ? "animate-bounce" : ""}`} />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerImport}
            disabled={importing || loading}
            className="gap-2"
            title="Importar routers y OLTs desde un archivo JSON"
          >
            <Upload className={`size-4 ${importing ? "animate-pulse" : ""}`} />
            {importing ? "Importando..." : "Importar JSON"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRouters}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <Button size="sm" onClick={() => openRouterModal()} className="gap-2">
            <Plus className="size-4" />
            Nuevo Router
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Barra de estado y métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Network className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Routers MikroTik</div>
              <div className="text-lg font-semibold">{routers.length} activos</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">OLTs Conectadas</div>
              <div className="text-lg font-semibold">{totalOlts} registradas</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Seguridad en Reposo</div>
              <div className="text-sm font-semibold flex items-center gap-1 text-purple-700 dark:text-purple-300">
                <Lock className="size-3.5" /> Bóveda AES-256-GCM
              </div>
            </div>
          </div>
        </div>

        {/* Listado de Routers */}
        {loading && routers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <span>Cargando infraestructura de red...</span>
          </div>
        ) : routers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            <Server className="size-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No hay routers registrados en el sistema</p>
            <p className="text-sm">Agrega el primer router MikroTik para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {routers.map((router) => {
              const testRes = connectionResults[router.id];
              const isTesting = testingRouterId === router.id;

              return (
                <div
                  key={router.id}
                  className="rounded-xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/40">
                    <div className="flex items-start md:items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <HardDrive className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{router.displayName}</h3>
                          <Badge variant="outline" className="font-mono text-xs">
                            {router.name}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {router.host}:{router.port}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            Usuario SSH:{" "}
                            <strong className="font-mono text-foreground">{router.username}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span>Clave:</span>
                            <span className="font-mono text-foreground font-medium">
                              {revealedPasswords[router.id] || "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealRouterPassword(router.id)}
                              disabled={loadingPassId === router.id}
                              title={
                                revealedPasswords[router.id]
                                  ? "Ocultar clave"
                                  : "Ver clave descifrada"
                              }
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            >
                              {loadingPassId === router.id ? (
                                <RefreshCw className="size-3 animate-spin" />
                              ) : revealedPasswords[router.id] ? (
                                <EyeOff className="size-3 text-amber-500" />
                              ) : (
                                <Eye className="size-3" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTestConnection(router)}
                        disabled={isTesting}
                        className={`gap-2 h-8 px-3 rounded-lg font-medium text-xs transition-all duration-200 border shadow-2xs group ${
                          isTesting
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 animate-pulse"
                            : testRes?.success
                              ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/20 border-emerald-500/40 hover:border-emerald-500/70 text-emerald-600 dark:text-emerald-400 shadow-xs shadow-emerald-500/10"
                              : testRes
                                ? "bg-gradient-to-r from-rose-500/15 to-red-500/10 hover:from-rose-500/25 hover:to-red-500/20 border-rose-500/40 hover:border-rose-500/70 text-rose-600 dark:text-rose-400 shadow-xs shadow-rose-500/10"
                                : "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 hover:from-amber-500/25 hover:via-orange-500/20 hover:to-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/35 hover:border-amber-500/60 shadow-amber-500/5 hover:shadow-amber-500/15 active:scale-[0.98]"
                        }`}
                      >
                        {isTesting ? (
                          <RefreshCw className="size-3.5 animate-spin text-amber-500" />
                        ) : testRes?.success ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                        ) : testRes ? (
                          <AlertTriangle className="size-3.5 text-rose-500" />
                        ) : (
                          <Zap className="size-3.5 text-amber-500 fill-amber-500/20 group-hover:scale-110 transition-transform" />
                        )}
                        <span>
                          {isTesting
                            ? "Probando..."
                            : testRes?.success
                              ? `${testRes.latencyMs}ms (Todo OK)`
                              : testRes
                                ? testRes.details?.router?.success
                                  ? "Fallo OLT"
                                  : "Fallo Router"
                                : "Probar Conexión (Router + OLTs)"}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRouterModal(router)}
                        className="size-8 p-0"
                        title="Editar Router"
                      >
                        <Edit2 className="size-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRouter(router)}
                        className="size-8 p-0 text-destructive hover:text-destructive"
                        title="Eliminar Router"
                      >
                        <Trash2 className="size-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openOltModal(router)}
                        className="gap-1.5 h-8 text-xs font-medium"
                      >
                        <Plus className="size-3.5" />
                        Agregar OLT
                      </Button>
                    </div>
                  </div>

                  {/* Detalle de error si falló el test */}
                  {testRes && !testRes.success && (
                    <div className="mt-2.5 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>{testRes.error || testRes.message}</span>
                    </div>
                  )}

                  {/* Lista de OLTs vinculadas */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Cabeceras Ópticas (OLTs) — {router.olts?.length || 0}
                    </div>

                    {!router.olts || router.olts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                        No hay OLTs registradas en este router. Haz clic en "Agregar OLT" para
                        conectar una.
                      </div>
                    ) : (
                      <ScrollArea
                        className={(router.olts?.length || 0) > 3 ? "max-h-[320px] pr-2.5" : ""}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {router.olts.map((olt) => (
                            <div
                              key={olt.id}
                              className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span
                                    className="font-medium text-sm truncate"
                                    title={olt.displayName}
                                  >
                                    {olt.displayName || olt.name}
                                  </span>
                                  {getBrandBadge(olt.brand)}
                                </div>
                                <div className="space-y-0.5 text-xs text-muted-foreground font-mono">
                                  <div>
                                    IP: <span className="text-foreground">{olt.ip}</span>
                                  </div>
                                  <div>
                                    User:{" "}
                                    <span className="text-foreground font-semibold">
                                      {olt.username}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Clave:</span>
                                    <span className="text-foreground">
                                      {revealedPasswords[olt.id] || "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleRevealOltPassword(router.id, olt.id)}
                                      disabled={loadingPassId === olt.id}
                                      title={
                                        revealedPasswords[olt.id]
                                          ? "Ocultar clave"
                                          : "Ver clave descifrada"
                                      }
                                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                    >
                                      {loadingPassId === olt.id ? (
                                        <RefreshCw className="size-3 animate-spin" />
                                      ) : revealedPasswords[olt.id] ? (
                                        <EyeOff className="size-3 text-amber-500" />
                                      ) : (
                                        <Eye className="size-3" />
                                      )}
                                    </button>
                                  </div>
                                  {olt.slot && (
                                    <div>
                                      Slot: <span className="text-foreground">{olt.slot}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Error inline si falló la OLT */}
                              {oltResults[olt.id] && !oltResults[olt.id]?.success && (
                                <div className="mt-2 p-2 rounded-md bg-destructive/10 text-destructive text-[11px] leading-tight flex items-start gap-1.5">
                                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                                  <span>
                                    {oltResults[olt.id]?.error || oltResults[olt.id]?.message}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-border/30">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTestOlt(router, olt)}
                                  disabled={testingOltId === olt.id}
                                  className={`h-7 px-2.5 text-[11px] gap-1.5 font-semibold rounded-md transition-all duration-200 border shadow-2xs group ${
                                    testingOltId === olt.id
                                      ? "bg-sky-500/20 border-sky-500/50 text-sky-600 dark:text-sky-300 animate-pulse"
                                      : oltResults[olt.id]?.success
                                        ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/20 border-emerald-500/40 hover:border-emerald-500/70 text-emerald-600 dark:text-emerald-400"
                                        : oltResults[olt.id]
                                          ? "bg-gradient-to-r from-rose-500/15 to-red-500/10 hover:from-rose-500/25 hover:to-red-500/20 border-rose-500/40 hover:border-rose-500/70 text-rose-600 dark:text-rose-400"
                                          : "bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-blue-500/15 hover:from-sky-500/25 hover:via-cyan-500/20 hover:to-blue-500/25 text-sky-700 dark:text-sky-300 border-sky-500/35 hover:border-sky-500/60 shadow-sky-500/5 hover:shadow-sky-500/15 active:scale-[0.97]"
                                  }`}
                                  title="Probar login y credenciales en la OLT"
                                >
                                  {testingOltId === olt.id ? (
                                    <RefreshCw className="size-3 animate-spin text-sky-500" />
                                  ) : oltResults[olt.id]?.success ? (
                                    <CheckCircle2 className="size-3 text-emerald-500" />
                                  ) : oltResults[olt.id] ? (
                                    <AlertTriangle className="size-3 text-rose-500" />
                                  ) : (
                                    <Zap className="size-3 text-sky-500 fill-sky-500/30 group-hover:scale-110 transition-transform" />
                                  )}
                                  <span>
                                    {testingOltId === olt.id
                                      ? "Probando..."
                                      : oltResults[olt.id]?.success
                                        ? `${oltResults[olt.id]?.latencyMs}ms (Login OK)`
                                        : oltResults[olt.id]
                                          ? "Fallo OLT"
                                          : "Probar OLT"}
                                  </span>
                                </Button>

                                <div className="flex items-center gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openOltModal(router, olt)}
                                    className="size-7 p-0"
                                    title="Editar OLT"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteOlt(router.id, olt)}
                                    className="size-7 p-0 text-destructive hover:text-destructive"
                                    title="Eliminar OLT"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {oltResults[olt.id] && !oltResults[olt.id]?.success && (
                                <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-[11px] leading-tight">
                                  {oltResults[olt.id]?.error || oltResults[olt.id]?.message}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* MODAL ROUTER */}
      <Dialog open={routerModalOpen} onOpenChange={setRouterModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingRouter ? "Editar Router MikroTik" : "Registrar Nuevo Router"}
            </DialogTitle>
            <DialogDescription>
              Configura los parámetros de acceso SSH al router. Las credenciales se cifrarán
              automáticamente en la bóveda de seguridad.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="router-name">Identificador (slug)</Label>
                <Input
                  id="router-name"
                  placeholder="ej. bellavista"
                  value={routerForm.name}
                  onChange={(e) => setRouterForm({ ...routerForm, name: e.target.value })}
                  disabled={Boolean(editingRouter)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="router-display">Nombre Legible</Label>
                <Input
                  id="router-display"
                  placeholder="ej. Router Bellavista"
                  value={routerForm.displayName}
                  onChange={(e) => setRouterForm({ ...routerForm, displayName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="router-host">Host / IP Pública</Label>
                <Input
                  id="router-host"
                  placeholder="ej. 181.78.197.184"
                  value={routerForm.host}
                  onChange={(e) => setRouterForm({ ...routerForm, host: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="router-port">Puerto</Label>
                <Input
                  id="router-port"
                  type="number"
                  placeholder="8322"
                  value={routerForm.port}
                  onChange={(e) => setRouterForm({ ...routerForm, port: Number(e.target.value) })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="router-user">Usuario SSH</Label>
                <Input
                  id="router-user"
                  placeholder="ej. ANGEL"
                  value={routerForm.username}
                  onChange={(e) => setRouterForm({ ...routerForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="router-pass">Contraseña SSH</Label>
                  <button
                    type="button"
                    onClick={handleToggleRouterModalPass}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    title={showPassword ? "Ocultar clave" : "Ver clave actual"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-3 text-amber-500" />
                    ) : (
                      <Eye className="size-3" />
                    )}
                    <span className="text-[10px]">{showPassword ? "Ocultar" : "Revelar"}</span>
                  </button>
                </div>
                <Input
                  id="router-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingRouter ? "•••••••• (sin cambios)" : "Contraseña segura"}
                  value={routerForm.password}
                  onChange={(e) => setRouterForm({ ...routerForm, password: e.target.value })}
                  className="font-mono text-sm"
                />
                {editingRouter && (
                  <p className="text-[11px] text-muted-foreground">
                    Dejar vacío para no cambiar. Toca "Revelar" para ver la clave actual.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRouterModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRouter} disabled={saving}>
              {saving ? "Guardando..." : editingRouter ? "Actualizar Router" : "Crear Router"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL OLT */}
      <Dialog open={oltModalOpen} onOpenChange={setOltModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingOlt
                ? "Editar Cabecera OLT"
                : `Agregar OLT a ${selectedRouterForOlt?.displayName}`}
            </DialogTitle>
            <DialogDescription>
              Configura los parámetros de la OLT interna alcanzable a través del router MikroTik.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="olt-name">Identificador (slug)</Label>
                <Input
                  id="olt-name"
                  placeholder="ej. bicentenario"
                  value={oltForm.name}
                  onChange={(e) => setOltForm({ ...oltForm, name: e.target.value })}
                  disabled={Boolean(editingOlt)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="olt-brand">Fabricante / Marca</Label>
                <Select
                  value={oltForm.brand}
                  onValueChange={(val) => setOltForm({ ...oltForm, brand: val as OltBrand })}
                >
                  <SelectTrigger id="olt-brand">
                    <SelectValue placeholder="Selecciona fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="huawei">HUAWEI</SelectItem>
                    <SelectItem value="v-sol">V-SOL</SelectItem>
                    <SelectItem value="c-data">C-DATA</SelectItem>
                    <SelectItem value="kingtype">KINGTYPE</SelectItem>
                    <SelectItem value="s/m">S/M (Genérica)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="olt-display">Nombre Descriptivo</Label>
              <Input
                id="olt-display"
                placeholder="ej. OLT Bicentenario Norte"
                value={oltForm.displayName}
                onChange={(e) => setOltForm({ ...oltForm, displayName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="olt-ip">IP Interna (Gateway)</Label>
                <Input
                  id="olt-ip"
                  placeholder="172.40.0.132"
                  value={oltForm.ip}
                  onChange={(e) => setOltForm({ ...oltForm, ip: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="olt-slot">Slot / Puerto (Opcional)</Label>
                <Input
                  id="olt-slot"
                  placeholder="0/1"
                  value={oltForm.slot}
                  onChange={(e) => setOltForm({ ...oltForm, slot: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="olt-user">Usuario Acceso</Label>
                <Input
                  id="olt-user"
                  placeholder="admin / root"
                  value={oltForm.username}
                  onChange={(e) => setOltForm({ ...oltForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="olt-pass">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </button>
                </div>
                <Input
                  id="olt-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    editingOlt ? "Dejar en blanco para no cambiar" : "Contraseña de la OLT"
                  }
                  value={oltForm.password}
                  onChange={(e) => setOltForm({ ...oltForm, password: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOltModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOlt} disabled={saving}>
              {saving ? "Guardando..." : editingOlt ? "Actualizar OLT" : "Agregar OLT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
