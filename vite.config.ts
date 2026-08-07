/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import seo from "./scripts/seo-plugin";
import stripDsStore from "./scripts/strip-ds-store";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), seo(), stripDsStore()],
  resolve: {
    alias: {
      "#components": resolve(root, "src/components"),
      "#constants": resolve(root, "src/constants"),
      "#store": resolve(root, "src/store"),
      "#hoc": resolve(root, "src/hoc"),
      "#hooks": resolve(root, "src/hooks"),
      "#mobile": resolve(root, "src/mobile"),
      "#windows": resolve(root, "src/windows"),
      "#utils": resolve(root, "src/utils"),
      "#types": resolve(root, "src/types.ts"),
    },
  },
  /*
   * Tests live beside what they test, and share the aliases above so a spec
   * imports a module by the same name the app does.
   *
   * Node rather than a DOM environment: everything under test is pure logic
   * over `src/constants` — routes, the terminal engine, the window store — and
   * pulling in jsdom to satisfy one `sessionStorage` reference would be a
   * dependency bought for a single line. `setup.ts` supplies that instead.
   */
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
});
