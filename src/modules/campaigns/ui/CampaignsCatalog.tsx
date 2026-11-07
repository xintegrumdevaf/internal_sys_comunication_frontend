import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { type Campaign } from "../domain/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Layers,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCampaignActions } from "../application/use-campaigns";
import { CampaignDetailsDrawer } from "./CampaignDetailsDrawer";
import { CampaignsMetricsHeader } from "./CampaignsMetricsHeader";
import { CampaignsTableRow } from "./CampaignsTableRow";

type CampaignsCatalogProps = {
  campaigns: Campaign[];
  isLoading: boolean;
  onNewCampaignClick: () => void;
  onRefresh?: () => void;
};

const CAMPAIGNS_PER_PAGE = 8;

export const CampaignsCatalog: React.FC<CampaignsCatalogProps> = ({
  campaigns,
  isLoading,
  onNewCampaignClick,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { startCampaign, suspendCampaign, resumeCampaign, deleteCampaign, isProcessing } =
    useCampaignActions();

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    return filteredCampaigns.slice(start, start + CAMPAIGNS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCampaign(deleteTargetId);
      toast.success("Campaña eliminada correctamente");
      onRefresh?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Solo se pueden eliminar campañas en borrador",
      );
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startCampaign(id);
      toast.success("Campaña iniciada. Los workers la procesarán en segundo plano.");
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar la campaña");
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await suspendCampaign(id);
      toast.info("Campaña suspendida en el servidor");
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo suspender la campaña");
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeCampaign(id);
      toast.success("Campaña reanudada en segundo plano");
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reanudar la campaña");
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Campañas Masivas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Envía mensajes masivos por WhatsApp en segundo plano mediante workers asíncronos y
            monitorea su progreso en tiempo real.
          </p>
        </div>
        <Button
          onClick={onNewCampaignClick}
          className="gap-2 w-full sm:w-auto font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva campaña
        </Button>
      </div>

      {/* KPI Metrics Header */}
      {campaigns.length > 0 && <CampaignsMetricsHeader campaigns={campaigns} />}

      {/* Filters section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative sm:w-80 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de campaña..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 text-xs rounded-xl border-border bg-card shadow-2xs"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48 text-xs rounded-xl border-border bg-card cursor-pointer">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="RUNNING">En curso</SelectItem>
              <SelectItem value="SUSPENDED">Suspendido</SelectItem>
              <SelectItem value="COMPLETED">Terminado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground font-semibold self-end sm:self-auto">
          {filteredCampaigns.length} campaña{filteredCampaigns.length === 1 ? "" : "s"} encontrada
          {filteredCampaigns.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Table section */}
      <div className="rounded-2xl border border-border/80 overflow-hidden bg-card/80 shadow-xs backdrop-blur-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left table-fixed">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/80 font-bold">
              <tr>
                <th className="px-4 py-3 w-[26%]">Nombre de campaña</th>
                <th className="px-4 py-3 w-[15%]">Creado en</th>
                <th className="px-4 py-3 w-[20%]">Progreso de envío</th>
                <th className="px-4 py-3 w-[12%]">Estado</th>
                <th className="px-4 py-3 w-[17%]">Comportamiento</th>
                <th className="px-4 py-3 w-[10%] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-xs font-mono">
                    Cargando campañas...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-sm">No se encontraron campañas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Crea tu primera campaña masiva para empezar a enviar mensajes automáticos.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCampaigns.map((c) => (
                  <CampaignsTableRow
                    key={c.id}
                    campaign={c}
                    isProcessing={isProcessing}
                    onSelect={(id) => setSelectedCampaignId(id)}
                    onStart={(id) => void handleStart(id)}
                    onSuspend={(id) => void handleSuspend(id)}
                    onResume={(id) => void handleResume(id)}
                    onDeleteRequest={(id) => setDeleteTargetId(id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador de Campañas */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/70 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando{" "}
              <strong className="text-foreground font-mono">
                {(currentPage - 1) * CAMPAIGNS_PER_PAGE + 1}
              </strong>{" "}
              a{" "}
              <strong className="text-foreground font-mono">
                {Math.min(currentPage * CAMPAIGNS_PER_PAGE, filteredCampaigns.length)}
              </strong>{" "}
              de <strong className="text-foreground font-mono">{filteredCampaigns.length}</strong>{" "}
              campañas
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Details & Monitoring Modal */}
      <CampaignDetailsDrawer
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la campaña y todos sus destinatarios
              asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
