import { apiGet } from "@/lib/api-client";
import type { DashboardDto } from "@/modules/dashboard/domain/dashboard";

/** Puerto de infraestructura: GET /api/dashboard?userId= (docs/API_ENDPOINTS.md §6). */
export function getDashboard(userId: string): Promise<DashboardDto> {
  return apiGet<DashboardDto>("/api/dashboard", { query: { userId } });
}
