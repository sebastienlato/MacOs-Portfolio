import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
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

/**
 * Chromium does not rasterise a page identically twice. Resampling the
 * wallpaper leaves a drift of roughly ±2 per channel scattered through its
 * gradients — measured across many runs it never exceeded 24, and it is
 * invisible, but it is enough to change the encoded bytes every single time.
 *
 * So the file is rewritten only when something *visible* moved. Any real change
 * — a repositioned window, an edited label, a new icon — swings pixels by well
 * over 100 in far more than a handful of places, which is nowhere near this
 * floor. Without it, `npm run screenshots` would dirty the working tree on
 * every run and there would be no way to tell a real diff from noise.
 */
const NOISE_CEILING = 48;
const NOISE_ALLOWANCE = 200;

/**
 * Polls a reading until it stops changing, and hands back the last one.
 *
 * Waiting on the animated property instead does not work. Chromium serializes a
 * computed opacity of 0.99997 as "1", so a tween reads as finished about 3%
 * before it has landed — which was leaving the window a visible fraction of a
 * pixel short of where the next run would put it.
 */
const stillness = async (read, label) => {
  let previous = await read();

  for (let attempt = 0; attempt < 40; attempt++) {
    await setTimeout(100);
    const next = await read();
    if (next === previous) return next;
    previous = next;
  }

  throw new Error(`${label} never came to rest`);
};

const boxOf = (page, selector) => () =>
  page.locator(selector).boundingBox().then(JSON.stringify);

/** Every icon's transform at once — the dock eases them back one by one. */
const dockAtRest = (page) => () =>
  page.$$eval("#dock .dock-icon", (icons) =>
    icons.map((icon) => getComputedStyle(icon).transform).join(" ")
  );

/**
 * Opens the Finder so the shot shows the thing that makes this a desktop —
 * a window, and the per-app menu bar that swaps in behind it — rather than
 * just a wallpaper.
 */
const openFinder = async (page) => {
  await page.click('#dock button[aria-label="Portfolio"]');
  await page.waitForSelector("#finder");

  /*
   * Drop the window far enough that its bottom edge clears the hero.
   *
   * Where it opens, it stops partway down the word "portfolio", and a
   * half-covered letterform reads as a broken render rather than as one thing
   * in front of another. Covering the hero outright is honest — windows cover
   * the wallpaper — while clearing it entirely is impossible, since the two are
   * centred on the same screen. Nudging beats resizing: the window keeps the
   * proportions it was designed at, instead of gaining a band of empty pane.
   */
  const finder = JSON.parse(
    await stillness(boxOf(page, "#finder"), "the Finder window")
  );
  const hero = await page.locator("#welcome").boundingBox();
  // Rounded so the drag lands on a whole pixel rather than wherever the
  // measurement happened to fall
  const drop = Math.round(hero.y + hero.height + 24 - (finder.y + finder.height));

  const header = await page.locator("#finder #window-header").boundingBox();
  const x = header.x + header.width / 2;
  const y = header.y + header.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + drop, { steps: 12 });
  await page.mouse.up();

  // The pointer is now inside the window, and was over the dock before that —
  // which leaves an icon magnified and its tooltip up. Park it over empty
  // wallpaper, clear of the desktop icons and of the hero, whose letters
  // animate under the cursor.
  await page.mouse.move(40, 760);

  await stillness(boxOf(page, "#finder"), "the Finder window");
  // The magnified icons ease back over 0.3s, and a shot taken mid-flight
  // catches one of them still raised
  await stillness(dockAtRest(page), "the dock");
};

const SHOTS = [
  {
    name: "screenshot",
    /** 3:2, the shape the README's side-by-side widths are picked for. */
    viewport: { width: 1280, height: 853 },
    /** Captured at 2x and resized down, which is sharper than rendering at 1x. */
    width: 2000,
    hasTouch: false,
    prepare: openFinder,
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

/**
 * Chromium's first paint in a fresh process does not match the ones after it,
 * so one frame is rendered and thrown away before any real shot is taken.
 */
const warmUp = async (browser, url) => {
  const context = await browser.newContext({
    viewport: SHOTS[0].viewport,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector(".boot-screen", { state: "detached", timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot();

  await context.close();
};

/**
 * The link preview card, composed from the two shots rather than captured from
 * the app — neither shell on its own says what this is any more.
 *
 * Built from the files on disk, not from the buffers just rendered, so that
 * whenever the screenshots come out unchanged this comes out identical too.
 *
 * Stays 1200x630 JPEG: those are the dimensions and the type index.html already
 * declares to scrapers, and they are not worth disagreeing with.
 */
const renderOgCard = async (browser) => {
  const uri = async (path, mime) =>
    `data:${mime};base64,${(await readFile(resolve(root, path))).toString("base64")}`;

  const [wallpaper, desktop, phone] = await Promise.all([
    uri("public/images/wallpaper.webp", "image/webp"),
    uri("docs/screenshot.webp", "image/webp"),
    uri("docs/screenshot-mobile.webp", "image/webp"),
  ]);

  const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Georama:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: 1200px; height: 630px; overflow: hidden;
    font-family: Georama, system-ui, -apple-system, sans-serif;
  }
  /* The desktop's own wallpaper, pushed back so the shots read in front of it */
  .bg {
    position: absolute; inset: -30px;
    background: url(${wallpaper}) center / cover;
    filter: blur(16px) saturate(1.15) brightness(0.5);
  }
  .scrim {
    position: absolute; inset: 0;
    background: linear-gradient(100deg,
      rgb(8 8 30 / 0.94) 0%, rgb(8 8 30 / 0.78) 34%,
      rgb(8 8 30 / 0.34) 68%, rgb(8 8 30 / 0.22) 100%);
  }
  .wrap { position: relative; height: 100%; display: flex; align-items: center; }
  .copy { width: 366px; padding-left: 60px; color: #fff; }
  .copy .eyebrow {
    font-size: 13px; font-weight: 600; letter-spacing: 0.16em;
    text-transform: uppercase; color: rgb(255 255 255 / 0.55);
  }
  .copy h1 {
    margin: 12px 0 0; font-size: 50px; font-weight: 700;
    letter-spacing: -0.5px; line-height: 1.05;
  }
  .copy p {
    margin: 16px 0 0; font-size: 20px; font-weight: 300;
    line-height: 1.45; color: rgb(255 255 255 / 0.8);
  }
  .shots { position: absolute; right: 40px; top: 0; width: 724px; height: 100%; }
  .shots img { position: absolute; display: block; }
  /* Overlapped the way a device line-up is shown: the big one behind */
  .shots .desktop {
    left: 0; top: 112px; width: 600px; border-radius: 11px;
    box-shadow: 0 26px 64px rgb(0 0 0 / 0.55);
  }
  .shots .phone {
    right: 0; top: 72px; height: 486px; border-radius: 27px;
    border: 3px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 26px 64px rgb(0 0 0 / 0.62);
  }
</style></head>
<body>
  <div class="bg"></div><div class="scrim"></div>
  <div class="wrap">
    <div class="copy">
      <div class="eyebrow">Portfolio</div>
      <h1>Sebastien Lato</h1>
      <p>A macOS desktop you can actually use — and an iOS Home Screen on your phone.</p>
    </div>
    <div class="shots">
      <img class="desktop" src="${desktop}" alt="">
      <img class="phone" src="${phone}" alt="">
    </div>
  </div>
</body></html>`;

  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const raw = await page.screenshot();
  await context.close();

  return sharp(raw).resize({ width: 1200 }).jpeg({ quality: 86 }).toBuffer();
};

/** True when the two encoded images differ by more than the rasteriser's drift. */
const differsVisibly = async (next, path) => {
  let current;
  try {
    current = await readFile(path);
  } catch {
    return true; // nothing to compare against yet
  }

  const [a, b] = await Promise.all([
    sharp(current).raw().toBuffer({ resolveWithObject: true }),
    sharp(next).raw().toBuffer({ resolveWithObject: true }),
  ]);

  if (a.data.length !== b.data.length) return true;

  let loud = 0;
  for (let i = 0; i < a.data.length; i++) {
    if (Math.abs(a.data[i] - b.data[i]) <= NOISE_CEILING) continue;
    if (++loud > NOISE_ALLOWANCE) return true;
  }

  return false;
};

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
  // Pinned so the host display's colour profile cannot tint the output
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });

  try {
    await warmUp(browser, url);

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
      await shot.prepare?.(page);
      await freezeClock(page);

      const encoded = await sharp(await page.screenshot())
        .resize({ width: shot.width })
        .webp({ quality: 82 })
        .toBuffer();

      await context.close();

      const target = resolve(outDir, `${shot.name}.webp`);
      const changed = await differsVisibly(encoded, target);
      if (changed) await writeFile(target, encoded);

      console.log(`  docs/${shot.name}.webp  ${changed ? "updated" : "unchanged"}`);
    }

    const card = await renderOgCard(browser);
    const ogPath = resolve(root, "public", "og.jpg");
    const ogChanged = await differsVisibly(card, ogPath);
    if (ogChanged) await writeFile(ogPath, card);

    console.log(`  public/og.jpg         ${ogChanged ? "updated" : "unchanged"}`);
  } finally {
    await browser.close();
    await server.close();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
