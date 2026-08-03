import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    react(),
  ],
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
  },
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io", ".ngrok.app"],
  },
});
