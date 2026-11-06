import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePreservedScrollTop, usePreservedListScroll } from "./use-preserved-list-scroll";

function rect(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    left: 0,
    right: 200,
    bottom: top + height,
    width: 200,
    height,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

describe("resolvePreservedScrollTop", () => {
  it("no mueve la lista si el agente estaba en el tope", () => {
    expect(resolvePreservedScrollTop({ id: "jaime", offset: 0, scrollTop: 0 }, 0, 120)).toBeNull();
  });

  it("compensa el salto al inicio para dejar la misma fila en el mismo sitio", () => {
    expect(resolvePreservedScrollTop({ id: "jaime", offset: 12, scrollTop: 640 }, 0, 280)).toBe(
      268,
    );
  });

  it("no corrige si la fila ya quedó en su sitio", () => {
    expect(
      resolvePreservedScrollTop({ id: "jaime", offset: 12, scrollTop: 640 }, 908, 12),
    ).toBeNull();
  });

  it("no inventa una posición si la fila ya no está en la lista", () => {
    expect(
      resolvePreservedScrollTop({ id: "jaime", offset: 12, scrollTop: 640 }, 0, null),
    ).toBeNull();
  });
});

describe("usePreservedListScroll", () => {
  const originalRect = Element.prototype.getBoundingClientRect;
  const originalClientRects = Element.prototype.getClientRects;
  let tops: Record<string, number> = {};
  let listVisible = true;

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalRect;
    Element.prototype.getClientRects = originalClientRects;
    vi.restoreAllMocks();
    tops = {};
    listVisible = true;
    cleanup();
  });

  function installRects() {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.dataset.testid === "conversation-list") return listVisible ? 160 : 0;
      return 0;
    });
    Element.prototype.getClientRects = function (this: Element) {
      if (this instanceof HTMLElement && this.dataset.testid === "conversation-list") {
        return (listVisible ? [rect(0, 160)] : []) as unknown as DOMRectList;
      }
      return originalClientRects.call(this);
    };
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this instanceof HTMLElement && this.dataset.testid === "conversation-list") {
        return rect(0, 160);
      }
      if (this instanceof HTMLElement && this.dataset.conversationId) {
        return rect(tops[this.dataset.conversationId] ?? 0, 40);
      }
      return originalRect.call(this);
    };
  }

  function ListHarness() {
    const [ids, setIds] = useState(["a", "b", "c"]);
    const { ref, onScroll } = usePreservedListScroll(ids);
    return (
      <>
        <button type="button" onClick={() => setIds(["z", "a", "b", "c"])}>
          nuevo chat
        </button>
        <div ref={ref} onScroll={onScroll} data-testid="conversation-list">
          {ids.map((id) => (
            <div key={id} data-conversation-id={id}>
              {id}
            </div>
          ))}
        </div>
      </>
    );
  }

  it("si ya estaba abajo, un chat nuevo no lo devuelve al inicio", () => {
    installRects();
    tops = { a: -80, b: -40, c: 0 };
    render(<ListHarness />);
    const list = screen.getByTestId("conversation-list");
    list.scrollTop = 80;
    fireEvent.scroll(list);

    tops = { z: 0, a: 40, b: 80, c: 120 };
    list.scrollTop = 0;
    fireEvent.click(screen.getByRole("button", { name: "nuevo chat" }));

    expect(list.scrollTop).toBe(120);
  });

  it("si estaba en el tope, se queda ahí para ver el chat que acaba de entrar", () => {
    installRects();
    tops = { a: 0, b: 40, c: 80 };
    render(<ListHarness />);
    const list = screen.getByTestId("conversation-list");
    list.scrollTop = 0;
    fireEvent.scroll(list);

    tops = { z: 0, a: 40, b: 80, c: 120 };
    fireEvent.click(screen.getByRole("button", { name: "nuevo chat" }));

    expect(list.scrollTop).toBe(0);
  });

  it("no reescribe el scroll si la lista está oculta", () => {
    installRects();
    tops = { a: -80, b: -40, c: 0 };
    render(<ListHarness />);
    const list = screen.getByTestId("conversation-list");
    list.scrollTop = 80;
    fireEvent.scroll(list);

    listVisible = false;
    tops = { z: 0, a: 40, b: 80, c: 120 };
    list.scrollTop = 0;
    fireEvent.click(screen.getByRole("button", { name: "nuevo chat" }));

    expect(list.scrollTop).toBe(0);
  });
});
