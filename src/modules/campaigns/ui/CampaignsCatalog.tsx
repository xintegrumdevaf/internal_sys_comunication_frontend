import React, { useState } from 'react';
import { toast } from 'sonner';
import { Campaign, CampaignStatus } from '../domain/campaign';
import { campaignStatusMeta, formatRoutingBehaviorSummary } from '../domain/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  Layers,
  Megaphone,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useCampaignActions } from '../application/use-campaigns';
import { CampaignDetailsDrawer } from './CampaignDetailsDrawer';

type CampaignsCatalogProps = {
  campaigns: Campaign[];
  isLoading: boolean;
  onNewCampaignClick: () => void;
  onRefresh?: () => void;
};

export const CampaignsCatalog: React.FC<CampaignsCatalogProps> = ({
  campaigns,
  isLoading,
  onNewCampaignClick,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { startCampaign, suspendCampaign, resumeCampaign, deleteCampaign, isProcessing } =
    useCampaignActions();

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCampaign(deleteTargetId);
      toast.success('Campaña eliminada correctamente');
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Solo se pueden eliminar campañas en borrador');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startCampaign(id);
      toast.success('Campaña iniciada');
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar la campaña');
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await suspendCampaign(id);
      toast.info('Campaña suspendida');
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo suspender la campaña');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeCampaign(id);
      toast.success('Campaña reanudada');
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reanudar la campaña');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Megaphone className="w-6 h-6 text-primary" />
            Campañas
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Envía mensajes masivos a tus contactos y sigue el progreso de cada campaña.
          </p>
        </div>
        <Button onClick={onNewCampaignClick} className="gap-2 w-full sm:w-auto font-bold text-xs shadow-sm">
          <Plus className="w-4 h-4" />
          Nueva campaña
        </Button>
      </div>

      {/* Filters section */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative sm:w-80 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 text-xs">
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

      {/* Table section matching Whaticket */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre de campaña</th>
                <th className="px-4 py-3 font-semibold">Creado en</th>
                <th className="px-4 py-3 font-semibold">Progreso</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Comportamiento</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando campañas...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No se encontraron campañas.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => {
                  const meta = campaignStatusMeta(c.status);
                  const behavior = formatRoutingBehaviorSummary(c.routingConfig);
                  const progressStr = `${c.sentCount}/${c.totalRecipients || 0}`;
                  const createdDateStr = new Date(c.createdAt).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        <div className="font-semibold text-xs text-foreground">{c.name}</div>
                        {c.messageText && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 max-w-xs">
                            {c.messageText}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          {createdDateStr}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-semibold">
                          {progressStr}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant="outline" className={`text-[11px] ${meta.badgeClass}`}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground max-w-[200px] truncate text-[11px]">
                        {behavior}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver reporte y estadísticas */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedCampaignId(c.id)}
                            title="Ver reporte y detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {c.status === 'RUNNING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-amber-500 hover:text-amber-600 border-amber-500/30"
                              onClick={() => handleSuspend(c.id)}
                              disabled={isProcessing}
                            >
                              <Pause className="w-3.5 h-3.5" />
                              Suspender
                            </Button>
                          )}

                          {c.status === 'SUSPENDED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-emerald-500 hover:text-emerald-600 border-emerald-500/30"
                              onClick={() => handleResume(c.id)}
                              disabled={isProcessing}
                            >
                              <Play className="w-3.5 h-3.5" />
                              Reanudar
                            </Button>
                          )}

                          {c.status === 'DRAFT' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] gap-1 text-blue-500 hover:text-blue-600 border-blue-500/30"
                                onClick={() => handleStart(c.id)}
                                disabled={isProcessing}
                              >
                                <Play className="w-3.5 h-3.5" />
                                Iniciar
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                                onClick={() => setDeleteTargetId(c.id)}
                                disabled={isProcessing}
                                title="Eliminar borrador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          {(c.status === 'COMPLETED' || c.status === 'FINISHED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 text-primary hover:text-primary/90 border-primary/30"
                              onClick={() => handleStart(c.id)}
                              disabled={isProcessing}
                              title="Reenviar campaña"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reenviar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Details & Monitoring Drawer */}
      <CampaignDetailsDrawer
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la campaña y todos sus destinatarios asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};