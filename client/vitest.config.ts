import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
      cn: `${rootDir}lib/utils.ts`,
    },
    // The API DTOs and the contract test helpers must share a single copy of
    // these decorator-metadata libraries, otherwise the decorators register in
    // one module instance and `validate`/`plainToInstance` read from another.
    dedupe: ["class-transformer", "class-validator", "reflect-metadata"],
  },
  // API request DTOs import decorator-based `class-validator` code; enable the
  // legacy decorator transform so contract tests can load the real DTOs.
  esbuild: {
    tsconfigRaw: {
      compilerOptions: { experimentalDecorators: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "out/**", "android/**"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "hooks/**", "components/**", "providers/**"],
      // `components/ui/**` is generated shadcn code (the project test-quality
      // skill explicitly does not require testing generated primitives);
      // mocks/test helpers are not app code and `*.types.ts` has no runtime.
      exclude: [
        "**/*.test.*",
        "lib/mocks/**",
        "lib/test/**",
        "**/*.types.ts",
        "components/ui/**",
      ],
    },
  },
});
