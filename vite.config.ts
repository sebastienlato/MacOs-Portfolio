import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import seo from "./scripts/seo-plugin";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), seo()],
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
});
