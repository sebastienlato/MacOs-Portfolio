import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";
import { createServer } from "vite";

/**
 * Regenerates the README's screenshots.
 *
 * Both shells are captured from the same dev server in one run, so the pair in
 * the README can never end up showing two different versions of the app.
 *
 *   npm run screenshots
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs");

/** Deliberately not 5173, so a dev server you already have running is left alone. */
const PORT = 5199;

/**
 * The clock is overwritten just before the shutter. It is the one thing on
 * screen that changes every run, and without this every regeneration produces
 * a diff whether or not anything about the app actually moved. 9:41 is the
 * time Apple puts on its own device shots.
 */
const CLOCK = { desktop: "Fri Sep 12 9:41 AM", phone: "9:41" };

const SHOTS = [
  {
    name: "screenshot",
    /** 3:2, the shape the README's side-by-side widths are picked for. */
    viewport: { width: 1280, height: 853 },
    /** Captured at 2x and resized down, which is sharper than rendering at 1x. */
    width: 2000,
    hasTouch: false,
  },
  {
    name: "screenshot-mobile",
    viewport: { width: 375, height: 812 },
    width: 750,
    /**
     * The phone breakpoint has a `pointer: coarse` clause for a phone held
     * sideways. Without touch emulation this would only ever be a narrow
     * desktop window, which is not the thing being photographed.
     */
    hasTouch: true,
  },
];

/** Everything that has to settle before the app is worth photographing. */
const settle = async (page) => {
  // The boot screen unmounts itself when its timeline finishes
  await page.waitForSelector(".boot-screen", { state: "detached", timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);

  // The menu bar samples the wallpaper's luminance to decide whether its
  // glyphs go dark, which it can only do once the image has decoded
  await page.waitForFunction(() => {
    const main = document.querySelector("main.desktop");
    if (!main) return false;
    const url = getComputedStyle(main).backgroundImage.match(/url\("(.+?)"\)/)?.[1];
    if (!url) return true; // a gradient wallpaper — nothing to decode
    const img = new Image();
    img.src = url;
    return img.complete;
  });

  await page.waitForTimeout(300);
};

const freezeClock = (page) =>
  page.evaluate(({ desktop, phone }) => {
    const bar = document.querySelector("nav time");
    if (bar) bar.textContent = desktop;

    const status = document.querySelector(".status-bar .time");
    if (status) status.textContent = phone;
  }, CLOCK);

const run = async () => {
  await mkdir(outDir, { recursive: true });

  const server = await createServer({
    root,
    configFile: resolve(root, "vite.config.ts"),
    server: { port: PORT, strictPort: true },
    logLevel: "warn",
  });
  await server.listen();

  const url = server.resolvedUrls.local[0];
  const browser = await chromium.launch();

  try {
    for (const shot of SHOTS) {
      const context = await browser.newContext({
        viewport: shot.viewport,
        deviceScaleFactor: 2,
        hasTouch: shot.hasTouch,
        isMobile: shot.hasTouch,
        // Pinned so the shot does not flip with whatever the machine running
        // this happens to prefer
        colorScheme: "light",
        reducedMotion: "no-preference",
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: "load" });

      await settle(page);
      await freezeClock(page);

      const raw = resolve(outDir, `${shot.name}.raw.png`);
      await page.screenshot({ path: raw });

      await sharp(raw)
        .resize({ width: shot.width })
        .webp({ quality: 82 })
        .toFile(resolve(outDir, `${shot.name}.webp`));

      await rm(raw);
      await context.close();

      console.log(`  docs/${shot.name}.webp  ${shot.width}px wide`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
