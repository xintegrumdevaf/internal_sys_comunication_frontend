import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToneRefinement } from "./useToneRefinement";

const mockRefineTone = vi.fn();

vi.mock("@/services/quick-replies.api", () => ({
  quickRepliesApi: {
    refineTone: (...args: unknown[]) => mockRefineTone(...args),
  },
}));

describe("useToneRefinement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia con estados en default (inactivo, sin sugerencia, sin error)", () => {
    const { result } = renderHook(() => useToneRefinement());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("no ejecuta la llamada si el texto tiene menos de 5 caracteres", async () => {
    const { result } = renderHook(() => useToneRefinement());

    await act(async () => {
      await result.current.refineTone("abc");
    });

    expect(mockRefineTone).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestion).toBeNull();
  });

  it("obtiene y guarda la sugerencia refinada con éxito", async () => {
    mockRefineTone.mockResolvedValue("Hola estimado {{nombre}}, ¿en qué le podemos colaborar?");
    const { result } = renderHook(() => useToneRefinement());

    await act(async () => {
      await result.current.refineTone("Hola {{nombre}} ayuda");
    });

    expect(mockRefineTone).toHaveBeenCalledWith("Hola {{nombre}} ayuda");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestion).toBe(
      "Hola estimado {{nombre}}, ¿en qué le podemos colaborar?",
    );
    expect(result.current.error).toBeNull();
  });

  it("maneja errores de la API correctamente", async () => {
    mockRefineTone.mockRejectedValue(new Error("Fallo en servicio de IA"));
    const { result } = renderHook(() => useToneRefinement());

    await act(async () => {
      await result.current.refineTone("Texto suficientemente largo");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBe("Fallo en servicio de IA");
  });

  it("aplica la sugerencia invocando onApply y limpiando el estado", async () => {
    mockRefineTone.mockResolvedValue("Texto sugerido por IA");
    const onApply = vi.fn();
    const { result } = renderHook(() => useToneRefinement({ onApply }));

    await act(async () => {
      await result.current.refineTone("Texto original");
    });

    expect(result.current.suggestion).toBe("Texto sugerido por IA");

    act(() => {
      result.current.applySuggestion();
    });

    expect(onApply).toHaveBeenCalledWith("Texto sugerido por IA");
    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("descarta la sugerencia limpiando el estado", async () => {
    mockRefineTone.mockResolvedValue("Texto sugerido");
    const { result } = renderHook(() => useToneRefinement());

    await act(async () => {
      await result.current.refineTone("Texto a refinar");
    });

    expect(result.current.suggestion).toBe("Texto sugerido");

    act(() => {
      result.current.discardSuggestion();
    });

    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("reset limpia tanto sugerencia como error", () => {
    const { result } = renderHook(() => useToneRefinement());

    act(() => {
      result.current.reset();
    });

    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
