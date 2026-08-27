import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./theme-provider";
import { ThemeToggle } from "./ThemeToggle";

function TestConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="resolved-val">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeProvider and ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it("proporciona tema inicial y permite cambiarlo", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-val")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved-val")).toHaveTextContent("light");

    await user.click(screen.getByText("Set Dark"));

    expect(screen.getByTestId("theme-val")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-val")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("netops_theme")).toBe("dark");
  });

  it("renderiza ThemeToggle en modo dropdown y permite seleccionar temas", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle variant="dropdown" />
      </ThemeProvider>,
    );

    const toggleBtn = screen.getByRole("button", { name: /cambiar tema/i });
    expect(toggleBtn).toBeInTheDocument();

    await user.click(toggleBtn);

    const darkOption = screen.getByText("Oscuro");
    expect(darkOption).toBeInTheDocument();

    await user.click(darkOption);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("renderiza ThemeToggle en modo segmented", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle variant="segmented" />
      </ThemeProvider>,
    );

    const darkBtn = screen.getByTitle("Modo Oscuro");
    await user.click(darkBtn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
