import type { TagItem } from "@/modules/tags/domain/tag";

export type ContractDto = {
  id: string;
  customerId: string;
  contractNumber: string;
  sector: string | null;
  oltName: string | null;
  pon: string | null;
  serial: string | null;
  routerModel: string | null;
  status: string;
  createdAt: string;
};

export type CustomerDto = {
  id: string;
  fullName: string | null;
  waPhone: string | null;
  nationalId: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagItem[];
  contracts: ContractDto[];
  lastMessageAt?: string | null;
  waProfileName?: string | null;
  conversationId?: string | null;
};

export type ListCustomersParams = {
  search?: string;
  tagId?: string;
  hasTags?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type ListCustomersResponse = {
  data: CustomerDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateCustomerPayload = {
  fullName: string;
  waPhone: string;
  nationalId?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  tagIds?: string[];
};

export type UpdateCustomerPayload = {
  fullName?: string | null;
  waPhone?: string | null;
  nationalId?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  tagIds?: string[];
};

export type SyncIspResponse = {
  data: {
    customer: CustomerDto;
    contractsCount: number;
    syncedSectors: string[];
  };
};
