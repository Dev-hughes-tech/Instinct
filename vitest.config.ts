import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // Dual Vite installs (Next + Vitest) ship slightly different Plugin type
  // declarations; cast resolves the structural mismatch without runtime impact.
  plugins: [react() as unknown as never],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    css: false
  }
});
