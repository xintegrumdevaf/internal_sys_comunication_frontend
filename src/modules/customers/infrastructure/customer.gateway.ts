import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/http/http-client";
import type {
  CreateCustomerPayload,
  CustomerDto,
  ListCustomersParams,
  ListCustomersResponse,
  SyncIspResponse,
  UpdateCustomerPayload,
} from "../domain/customer";

export const customerGateway = {
  list: async (params?: ListCustomersParams): Promise<ListCustomersResponse> => {
    const query: Record<string, string | number | undefined> = {};
    if (params?.search) query.search = params.search;
    if (params?.tagId) query.tagId = params.tagId;
    if (params?.hasTags !== undefined) query.hasTags = String(params.hasTags);
    if (params?.startDate) query.startDate = params.startDate;
    if (params?.endDate) query.endDate = params.endDate;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;

    return apiGet<ListCustomersResponse>("/api/customers", {
      query,
      raw: true,
    });
  },

  getById: async (id: string): Promise<CustomerDto> => {
    return apiGet<CustomerDto>(`/api/customers/${id}`);
  },

  create: async (payload: CreateCustomerPayload): Promise<CustomerDto> => {
    return apiPost<CustomerDto>("/api/customers", payload);
  },

  update: async (id: string, payload: UpdateCustomerPayload): Promise<CustomerDto> => {
    return apiPatch<CustomerDto>(`/api/customers/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return apiDelete(`/api/customers/${id}`);
  },

  syncIsp: async (id: string, nationalId?: string): Promise<SyncIspResponse["data"]> => {
    return apiPost<SyncIspResponse["data"]>(`/api/customers/${id}/sync-isp`, {
      nationalId,
    });
  },
};
