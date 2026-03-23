import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "next/image": path.resolve(__dirname, "__mocks__/next-image.tsx"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", ".worktrees/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
