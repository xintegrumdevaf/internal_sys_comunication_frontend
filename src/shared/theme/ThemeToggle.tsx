import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";

interface ThemeToggleProps {
  variant?: "dropdown" | "segmented" | "button";
  className?: string;
}

export function ThemeToggle({ variant = "dropdown", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "segmented") {
    return (
      <div
        className={`flex items-center p-1 rounded-xl bg-background border border-border gap-1 shadow-2xs ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          title="Modo Claro"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === "light"
              ? "bg-card text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sun className="size-3.5" />
          <span>Claro</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          title="Modo Oscuro"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === "dark"
              ? "bg-card text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Moon className="size-3.5" />
          <span>Oscuro</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          title="Seguir Sistema"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === "system"
              ? "bg-card text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Laptop className="size-3.5" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  // Variant "button" (Toggle rápido entre light y dark)
  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title={`Cambiar a modo ${resolvedTheme === "dark" ? "claro" : "oscuro"}`}
        className={`p-2 rounded-xl border border-border bg-card hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors shadow-2xs ${className}`}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="size-4 text-amber-400 animate-fade-in" />
        ) : (
          <Moon className="size-4 text-primary animate-fade-in" />
        )}
      </button>
    );
  }

  // Variant "dropdown"
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Cambiar tema de la aplicación"
        className="flex items-center justify-center size-9 rounded-xl border border-border bg-card hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="size-4 text-primary animate-fade-in" />
        ) : (
          <Sun className="size-4 text-amber-500 animate-fade-in" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card p-1 shadow-lg z-50 animate-fade-up text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              theme === "light"
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-foreground/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="size-3.5" />
              <span>Claro</span>
            </div>
            {theme === "light" && <Check className="size-3 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-foreground/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="size-3.5" />
              <span>Oscuro</span>
            </div>
            {theme === "dark" && <Check className="size-3 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              theme === "system"
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-foreground/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="size-3.5" />
              <span>Sistema</span>
            </div>
            {theme === "system" && <Check className="size-3 text-primary" />}
          </button>
        </div>
      )}
    </div>
  );
}
