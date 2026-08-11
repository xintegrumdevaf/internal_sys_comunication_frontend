/** Entidad Department real del backend (isp-customer-service-api). */
export type DepartmentVisibility = "shared" | "restricted";

export type DepartmentDto = {
  id: string;
  slug: string; // "support" | "billing" | "sales" (seed real, ver scripts/seed.ts del backend)
  name: string;
  visibility: DepartmentVisibility;
  active: boolean;
  createdAt: string;
};
