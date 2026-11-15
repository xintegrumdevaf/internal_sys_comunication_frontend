import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "netops_theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const fromUrl = new URLSearchParams(window.location.search).get("theme");
      if (fromUrl === "dark" || fromUrl === "light") {
        localStorage.setItem(storageKey, fromUrl);
        return fromUrl;
      }
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && ["dark", "light", "system"].includes(stored)) {
        return stored;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const applyResolved = (next: "dark" | "light") => {
      root.classList.toggle("dark", next === "dark");
      root.classList.toggle("light", next === "light");
      setResolvedTheme(next);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (theme === "system") {
      applyResolved(mediaQuery.matches ? "dark" : "light");
    } else {
      applyResolved(theme);
    }

    const handleChange = () => {
      if (theme === "system") {
        applyResolved(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newTheme);
      }
      setThemeState((prev) => (prev === newTheme ? prev : newTheme));
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
