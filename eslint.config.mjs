import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // vinext build artifacts
    "dist/**",
    "next-env.d.ts",
    // GSD tooling — not part of the app bundle
    ".claude/**",
    ".planning/**",
    ".codex/**",
  ]),
]);

export default eslintConfig;
