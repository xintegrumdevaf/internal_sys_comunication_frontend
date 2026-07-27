import type { DepartmentId } from "@/core/shared/domain/ids";

export type DepartmentSlug =
  | "soporte"
  | "cartera"
  | "administracion"
  | "ti"
  | "traslados"
  | (string & {});

export type Department = {
  id: DepartmentId;
  slug: DepartmentSlug;
  name: string;
  description: string;
  landingPath: string;
  active: boolean;
  createdAt: Date;
};

export function createDepartment(input: {
  id: DepartmentId;
  slug: DepartmentSlug;
  name: string;
  description: string;
  landingPath: string;
}): Department {
  return {
    ...input,
    active: true,
    createdAt: new Date(),
  };
}
