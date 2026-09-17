import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves the `@/*` tsconfig path alias natively.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Unit/component tests live next to source as *.test.ts(x). Playwright E2E
    // specs under e2e/ are a separate gate and must not be collected here.
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    passWithNoTests: true,
  },
});
