import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Runner de tests (docs/skills/testing-strategy-frontend.md). Separado de
 * vite.config.ts (que trae el plugin de TanStack Start, pensado para servir
 * la app, no para correr tests) pero reutiliza los mismos alias de path.
 */
export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] }), react()],
  test: {
    environment: "jsdom",
    globals: false,
    css: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
