import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { departmentService } from "./department.service";
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from "@/types/department";

describe("departmentService", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function mockFetchOnce(body: unknown, status = 200) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: body })),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("getDepartments hace GET a /api/departments", async () => {
    const mockDepts = [
      {
        id: "dept-1",
        name: "Soporte Técnico",
        slug: "soporte",
        visibility: "shared",
        active: true,
        cases: [
          {
            id: "c-1",
            label: "Sin Conexión",
            description: "cuando el cliente no tiene internet",
            handlingMode: "ai_assisted",
          },
        ],
      },
    ];
    const fetchMock = mockFetchOnce(mockDepts);

    const result = await departmentService.getDepartments();

    expect(result).toEqual(mockDepts);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/departments");
    expect(init?.credentials).toBe("include");
  });

  it("createDepartment hace POST a /api/departments con description y cases", async () => {
    const payload: CreateDepartmentPayload = {
      name: "Cobranzas",
      slug: "cobranzas",
      description: "Área de pagos y acuerdos",
      visibility: "restricted",
      cases: [
        {
          label: "Promesa de Pago",
          description: "cuando pide prórroga de factura",
          handlingMode: "human_direct",
        },
      ],
    };
    const createdDept = { id: "dept-2", ...payload, active: true };
    const fetchMock = mockFetchOnce(createdDept);

    const result = await departmentService.createDepartment(payload);

    expect(result).toEqual(createdDept);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/departments");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual(payload);
  });

  it("updateDepartment hace PUT a /api/departments/:id", async () => {
    const payload: UpdateDepartmentPayload = {
      name: "Cobranzas & Facturación",
      cases: [
        {
          label: "Reclamo de Factura",
          description: "cuando el monto facturado no coincide",
          handlingMode: "ai_assisted",
        },
      ],
    };
    const updatedDept = { id: "dept-2", slug: "cobranzas", ...payload, active: true, visibility: "restricted" };
    const fetchMock = mockFetchOnce(updatedDept);

    const result = await departmentService.updateDepartment("dept-2", payload);

    expect(result).toEqual(updatedDept);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/departments/dept-2");
    expect(init?.method).toBe("PUT");
  });

  it("getDepartmentCases hace GET a /api/departments/:id/cases", async () => {
    const mockCases = [
      {
        id: "c-1",
        departmentId: "dept-1",
        label: "Cancelación de Contrato",
        description: "cuando el cliente pide darse de baja",
        handlingMode: "human_direct",
      },
    ];
    const fetchMock = mockFetchOnce(mockCases);

    const result = await departmentService.getDepartmentCases("dept-1");

    expect(result).toEqual(mockCases);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/departments/dept-1/cases");
  });

  it("addDepartmentCase hace POST a /api/departments/:id/cases", async () => {
    const newCase = {
      label: "Traslado",
      description: "cuando el cliente se muda",
      handlingMode: "ai_assisted" as const,
    };
    const createdCase = { id: "c-9", departmentId: "dept-1", ...newCase };
    const fetchMock = mockFetchOnce(createdCase);

    const result = await departmentService.addDepartmentCase("dept-1", newCase);

    expect(result).toEqual(createdCase);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/departments/dept-1/cases");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual(newCase);
  });

  it("deleteDepartmentCase hace DELETE a /api/departments/cases/:caseId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "",
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    await departmentService.deleteDepartmentCase("c-9");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/departments/cases/c-9");
    expect(init?.method).toBe("DELETE");
  });
});
