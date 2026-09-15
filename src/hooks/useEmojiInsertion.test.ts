import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEmojiInsertion } from "./useEmojiInsertion";

describe("useEmojiInsertion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia cerrado por defecto", () => {
    const { result } = renderHook(() => useEmojiInsertion("", vi.fn()));
    expect(result.current.isOpen).toBe(false);
  });

  it("permite abrir y cerrar mediante setIsOpen", () => {
    const { result } = renderHook(() => useEmojiInsertion("", vi.fn()));

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("concatena el emoji al final si no hay ref asignada", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useEmojiInsertion("Hola", onChange));

    act(() => {
      result.current.insertEmoji("👋");
    });

    expect(onChange).toHaveBeenCalledWith("Hola👋");
  });

  it("inserta el emoji en la posición exacta del cursor", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useEmojiInsertion<HTMLInputElement>("Hola mundo", onChange),
    );

    const mockInput = document.createElement("input");
    mockInput.value = "Hola mundo";
    mockInput.selectionStart = 4;
    mockInput.selectionEnd = 4;
    vi.spyOn(mockInput, "focus").mockImplementation(() => {});
    vi.spyOn(mockInput, "setSelectionRange").mockImplementation(() => {});

    Object.assign(result.current.inputRef, { current: mockInput });

    act(() => {
      result.current.insertEmoji("👋");
    });

    expect(onChange).toHaveBeenCalledWith("Hola👋 mundo");
  });

  it("cierra el selector al presionar la tecla Escape", () => {
    const { result } = renderHook(() => useEmojiInsertion("", vi.fn()));

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("cierra el selector al hacer clic fuera del contenedor", () => {
    const { result } = renderHook(() => useEmojiInsertion("", vi.fn()));

    const container = document.createElement("div");
    document.body.appendChild(container);

    Object.assign(result.current.containerRef, { current: container });

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    const outsideElement = document.createElement("button");
    document.body.appendChild(outsideElement);

    act(() => {
      outsideElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);

    document.body.removeChild(container);
    document.body.removeChild(outsideElement);
  });
});
