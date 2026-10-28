import { apiGet, apiPost } from "@/shared/http/http-client";

export interface CoverageZoneDto {
  name: string;
  city?: string;
  folder?: string;
  pointsCount: number;
  center: { lat: number; lng: number };
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

export interface CoverageCheckResultDto {
  hasCoverage: boolean;
  zoneName?: string;
  city?: string;
  matchType?: "exact_coordinates" | "text_sector_match" | "none";
  reason?: string;
  queryCoordinates?: { lat: number; lng: number };
}

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const coverageApi = {
  getZones: async (): Promise<CoverageZoneDto[]> => {
    const res = await apiGet<CoverageZoneDto[] | { data: CoverageZoneDto[] }>(
      "/api/coverage/zones",
    );
    return unwrap<CoverageZoneDto[]>(res);
  },

  checkLocation: async (params: {
    lat?: number;
    lng?: number;
    address?: string;
    locationUrl?: string;
  }): Promise<CoverageCheckResultDto> => {
    const res = await apiPost<CoverageCheckResultDto | { data: CoverageCheckResultDto }>(
      "/api/coverage/check",
      params,
    );
    return unwrap<CoverageCheckResultDto>(res);
  },

  importKmlFile: async (file: File): Promise<{ message: string; importedCount: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiPost<
      | { message: string; importedCount: number }
      | { data: { message: string; importedCount: number } }
    >("/api/admin/coverage/import-kml", formData);
    return unwrap<{ message: string; importedCount: number }>(res);
  },

  reloadMemory: async (): Promise<{ activeZonesCount: number }> => {
    const res = await apiPost<
      { activeZonesCount: number } | { data: { activeZonesCount: number } }
    >("/api/admin/coverage/reload");
    return unwrap<{ activeZonesCount: number }>(res);
  },
};
