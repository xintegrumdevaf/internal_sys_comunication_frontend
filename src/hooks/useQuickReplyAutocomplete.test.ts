import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuickReplyAutocomplete } from "./useQuickReplyAutocomplete";
import type { QuickReply } from "@/types/quick-reply";

const mockList = vi.fn();
const mockResolve = vi.fn();

vi.mock("@/services/quick-replies.api", () => ({
  quickRepliesApi: {
    list: (...args: unknown[]) => mockList(...args),
    resolve: (...args: unknown[]) => mockResolve(...args),
  },
}));

describe("useQuickReplyAutocomplete", () => {
  const mockReplies: QuickReply[] = [
    {
      id: "qr-1",
      shortcut: "saludo",
      title: "Saludo cordial",
      body: "Hola {{nombre}}, ¿en qué te ayudamos?",
      departmentId: null,
      category: "general",
      mediaUrl: null,
      createdByAgentId: "agent-1",
      active: true,
      createdAt: "2026-09-14T00:00:00Z",
      updatedAt: "2026-09-14T00:00:00Z",
    },
    {
      id: "qr-2",
      shortcut: "bancos",
      title: "Cuentas bancarias",
      body: "Nuestras cuentas son: Banco Pichincha 123456",
      departmentId: "dept-cobranzas",
      category: "cobranzas",
      mediaUrl: null,
      createdByAgentId: "agent-1",
      active: true,
      createdAt: "2026-09-14T00:00:00Z",
      updatedAt: "2026-09-14T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockReplies);
  });

  it("carga las respuestas rápidas al montar y filtra al escribir '/'", async () => {
    const onSelect = vi.fn();
    const { result, rerender } = renderHook(
      ({ inputText }) =>
        useQuickReplyAutocomplete({
          inputText,
          onSelect,
        }),
      {
        initialProps: { inputText: "" },
      },
    );

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    expect(result.current.isOpen).toBe(false);

    // Escribir /
    rerender({ inputText: "/" });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.filtered).toHaveLength(2);

    // Escribir /sal
    rerender({ inputText: "/sal" });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].shortcut).toBe("saludo");
  });

  it("navega con flechas y selecciona con Enter resolviendo variables", async () => {
    const onSelect = vi.fn();
    mockResolve.mockResolvedValue({
      quickReply: mockReplies[0],
      interpolatedBody: "Hola Carlos, ¿en qué te ayudamos?",
      contextUsed: { nombre: "Carlos" },
    });

    const { result } = renderHook(() =>
      useQuickReplyAutocomplete({
        inputText: "/",
        conversationId: "conv-999",
        onSelect,
      }),
    );

    await waitFor(() => {
      expect(result.current.filtered).toHaveLength(2);
    });

    expect(result.current.selectedIndex).toBe(0);

    // Flecha abajo -> índice 1
    act(() => {
      const handled = result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
      expect(handled).toBe(true);
    });
    expect(result.current.selectedIndex).toBe(1);

    // Flecha arriba -> índice 0
    act(() => {
      const handled = result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
      expect(handled).toBe(true);
    });
    expect(result.current.selectedIndex).toBe(0);

    // Presionar Enter -> llama a resolve y luego onSelect
    await act(async () => {
      const handled = result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
      expect(handled).toBe(true);
    });

    expect(mockResolve).toHaveBeenCalledWith({
      shortcut: "saludo",
      departmentId: undefined,
      conversationId: "conv-999",
    });
    expect(onSelect).toHaveBeenCalledWith("Hola Carlos, ¿en qué te ayudamos?");
  });

  it("cierra el menú al presionar Escape", async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useQuickReplyAutocomplete({
        inputText: "/banco",
        onSelect,
      }),
    );

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    act(() => {
      const handled = result.current.handleKeyDown({
        key: "Escape",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
      expect(handled).toBe(true);
    });

    expect(result.current.isOpen).toBe(false);
  });
});
