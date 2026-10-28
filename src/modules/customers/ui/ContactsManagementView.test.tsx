import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactsManagementView } from "./ContactsManagementView";
import { customerGateway } from "@/modules/customers/infrastructure/customer.gateway";
import { tagsGateway } from "@/modules/tags/infrastructure/tags.gateway";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe("ContactsManagementView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza el título, buscador y lista de contactos", async () => {
    vi.spyOn(tagsGateway, "list").mockResolvedValue([
      { id: "tag-1", name: "Bellavista", color: "#d97706", createdAt: "" },
    ]);

    vi.spyOn(customerGateway, "list").mockResolvedValue({
      data: [
        {
          id: "cust-1",
          fullName: "0000427 - GARCIA VELEZ",
          waPhone: "593983247516",
          nationalId: "0942783440",
          email: "garcia@example.com",
          createdAt: "2026-08-10T08:32:00.000Z",
          updatedAt: "2026-08-10T08:32:00.000Z",
          lastMessageAt: "2026-09-13T10:06:00.000Z",
          tags: [{ id: "tag-1", name: "Bellavista", color: "#d97706", createdAt: "" }],
          address: null,
          notes: null,
          contracts: [],
        },
      ],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    });

    render(<ContactsManagementView />);

    expect(screen.getByText("Contactos")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por nombre, teléfono/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("0000427 - GARCIA VELEZ")).toBeInTheDocument();
      expect(screen.getAllByText("Bellavista").length).toBeGreaterThan(0);
    });
  });

  it("permite abrir el modal de agregar contacto", async () => {
    vi.spyOn(tagsGateway, "list").mockResolvedValue([]);
    vi.spyOn(customerGateway, "list").mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 15, totalPages: 1 },
    });

    render(<ContactsManagementView />);

    const addBtn = screen.getByText("+ Agregar Contacto");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText("Nuevo Contacto")).toBeInTheDocument();
      expect(screen.getByText("Nombre completo *")).toBeInTheDocument();
    });
  });

  it("permite abrir el modal de edición de un contacto existente sin teléfono", async () => {
    vi.spyOn(tagsGateway, "list").mockResolvedValue([]);
    vi.spyOn(customerGateway, "list").mockResolvedValue({
      data: [
        {
          id: "cust-no-phone",
          fullName: "CAMPOS BERMEO GERMAN GREGORIO",
          waPhone: null,
          nationalId: "1204910853",
          email: null,
          createdAt: "2026-10-02T18:43:00.000Z",
          updatedAt: "2026-10-02T18:43:00.000Z",
          tags: [],
          contracts: [],
          address: null,
          notes: null,
        },
      ],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    });

    render(<ContactsManagementView />);

    await waitFor(() => {
      expect(screen.getByText("CAMPOS BERMEO GERMAN GREGORIO")).toBeInTheDocument();
    });

    const editBtn = screen.getByTitle("Editar contacto");
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText("Editar Contacto")).toBeInTheDocument();
      expect(screen.getByDisplayValue("CAMPOS BERMEO GERMAN GREGORIO")).toBeInTheDocument();
    });
  });

  it("permite abrir el diálogo de confirmación y eliminar un contacto", async () => {
    vi.spyOn(tagsGateway, "list").mockResolvedValue([]);
    vi.spyOn(customerGateway, "list").mockResolvedValue({
      data: [
        {
          id: "cust-to-delete",
          fullName: "Cliente Para Eliminar",
          waPhone: "593999999999",
          nationalId: "0102030405",
          email: null,
          createdAt: "2026-10-02T18:43:00.000Z",
          updatedAt: "2026-10-02T18:43:00.000Z",
          tags: [],
          contracts: [],
          address: null,
          notes: null,
        },
      ],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    });
    const deleteSpy = vi.spyOn(customerGateway, "delete").mockResolvedValue(undefined);

    render(<ContactsManagementView />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Para Eliminar")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Eliminar contacto");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Eliminar Contacto")).toBeInTheDocument();
      expect(
        screen.getByText(/¿Estás seguro de que deseas eliminar este contacto?/i),
      ).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Eliminar" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("cust-to-delete");
    });
  });
});
