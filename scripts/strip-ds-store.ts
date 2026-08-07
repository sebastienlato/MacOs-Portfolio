import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import type { Plugin } from "vite";

/**
 * Keeps Finder's metadata out of the upload.
 *
 * Everything in `public/` is copied into the build verbatim, and macOS drops a
 * `.DS_Store` into any folder that has been opened in Finder. Being gitignored
 * is exactly what made this hard to notice: it never appears in a diff, never
 * comes up in review, and still ends up in `dist/` on every build — and from
 * there in `public_html`, served to anyone who asks for it by name.
 *
 * Vite's public-dir copy is all-or-nothing, so there is no filter to set. The
 * alternative was turning `publicDir` off and copying the tree by hand, which
 * is a lot of machinery to own for one unwanted file. This sweeps the output
 * once instead, after everything has been written.
 *
 * The sweep is over the *output*. Deleting the copy in `public/` would be
 * reaching back into the working tree over something Finder is entitled to
 * recreate the moment the folder is opened again.
 */
const stripDsStore = (): Plugin => {
  let outDir: string;

  return {
    name: "portfolio-strip-ds-store",
    apply: "build",

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },

    // Not `generateBundle` — public files are copied alongside the bundle
    // rather than into it, so they are not there to be seen at that point.
    async closeBundle() {
      const sweep = async (dir: string) => {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const path = resolve(dir, entry.name);
          if (entry.isDirectory()) await sweep(path);
          else if (entry.name === ".DS_Store") await rm(path, { force: true });
        }
      };

      await sweep(outDir);
    },
  };
};

export default stripDsStore;
