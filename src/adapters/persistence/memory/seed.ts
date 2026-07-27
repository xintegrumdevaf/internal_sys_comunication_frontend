import { createDepartment } from "@/core/modules/departments/domain/department";
import type { Department } from "@/core/modules/departments/domain/department";
import type { User } from "@/core/modules/identity/domain/user";
import { asDepartmentId, asUserId } from "@/core/shared/domain/ids";

export const SEED_DEPARTMENTS: Department[] = [
  createDepartment({
    id: asDepartmentId("dept_ti"),
    slug: "ti",
    name: "TI / Infraestructura",
    description: "Operación de plataforma e infraestructura",
    landingPath: "/",
  }),
  createDepartment({
    id: asDepartmentId("dept_soporte"),
    slug: "soporte",
    name: "Soporte Técnico",
    description: "Diagnóstico y tickets de servicio",
    landingPath: "/soporte",
  }),
  createDepartment({
    id: asDepartmentId("dept_cartera"),
    slug: "cartera",
    name: "Cartera y Cobros",
    description: "Pagos, mora y validación de comprobantes",
    landingPath: "/cartera",
  }),
  createDepartment({
    id: asDepartmentId("dept_admin"),
    slug: "administracion",
    name: "Administración",
    description: "Gestión administrativa y campañas",
    landingPath: "/campanas",
  }),
  createDepartment({
    id: asDepartmentId("dept_traslados"),
    slug: "traslados",
    name: "Traslados / UTGA",
    description: "Instalaciones, traslados y visitas técnicas",
    landingPath: "/utga",
  }),
];

export const SEED_USERS: User[] = [
  {
    id: asUserId("u_admin"),
    name: "Javier Díaz",
    initials: "JD",
    email: "javier.diaz@netops.co",
    primaryDepartmentId: asDepartmentId("dept_ti"),
    memberships: [
      { userId: asUserId("u_admin"), departmentId: asDepartmentId("dept_ti"), role: "admin" },
      {
        userId: asUserId("u_admin"),
        departmentId: asDepartmentId("dept_admin"),
        role: "admin",
      },
    ],
    active: true,
  },
  {
    id: asUserId("u_soporte"),
    name: "Laura Mendoza",
    initials: "LM",
    email: "laura.mendoza@netops.co",
    primaryDepartmentId: asDepartmentId("dept_soporte"),
    memberships: [
      {
        userId: asUserId("u_soporte"),
        departmentId: asDepartmentId("dept_soporte"),
        role: "lead",
      },
    ],
    active: true,
  },
  {
    id: asUserId("u_cartera"),
    name: "Andrés Peña",
    initials: "AP",
    email: "andres.pena@netops.co",
    primaryDepartmentId: asDepartmentId("dept_cartera"),
    memberships: [
      {
        userId: asUserId("u_cartera"),
        departmentId: asDepartmentId("dept_cartera"),
        role: "agent",
      },
    ],
    active: true,
  },
  {
    id: asUserId("u_utga"),
    name: "María Restrepo",
    initials: "MR",
    email: "maria.restrepo@netops.co",
    primaryDepartmentId: asDepartmentId("dept_traslados"),
    memberships: [
      {
        userId: asUserId("u_utga"),
        departmentId: asDepartmentId("dept_traslados"),
        role: "lead",
      },
    ],
    active: true,
  },
];
