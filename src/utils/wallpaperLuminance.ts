import type { Wallpaper } from "#types";

/** Fraction of the wallpaper's height the menu bar actually sits over. */
const TOP_STRIP = 0.06;
/** Above this, the strip is bright enough that white text stops being legible. */
const LIGHT_THRESHOLD = 0.5;

const srgbToLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance, 0 (black) to 1 (white). */
const relativeLuminance = (r: number, g: number, b: number) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);

/** `#abc` / `#aabbcc` → luminance, or null if it isn't a hex colour. */
const hexLuminance = (hex: string) => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (full.length !== 6) return null;

  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return null;

  return relativeLuminance((int >> 16) & 255, (int >> 8) & 255, int & 255);
};

/**
 * Mean luminance of the top strip of an image, via a canvas readback. Every
 * wallpaper is same-origin (or a data: URL from an upload), so the canvas
 * stays untainted and getImageData is allowed.
 */
const imageLuminance = (src: string) =>
  new Promise<number | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Downsample hard — we want the average, not the detail
      const w = 64;
      const h = Math.max(1, Math.round(w * (img.height / img.width) * TOP_STRIP));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) return resolve(null);

      // Source rect is the top strip only; destination is the whole canvas
      ctx.drawImage(img, 0, 0, img.width, img.height * TOP_STRIP, 0, 0, w, h);

      try {
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += relativeLuminance(data[i], data[i + 1], data[i + 2]);
        }
        resolve(total / (data.length / 4));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Whether the menu bar needs dark text to stay legible over `wallpaper`.
 *
 * macOS picks menu bar tint from the wallpaper behind it rather than from the
 * appearance setting, which is why a transparent bar works there at all. For
 * gradients only the first stop matters — that is the end the menu bar covers.
 *
 * `src` is the file actually on screen, which is not always `wallpaper.value`:
 * the phone shows a smaller copy. Sampling the one being displayed makes this
 * a cache hit on an image already being fetched, where sampling the desktop
 * file downloaded a second, larger copy of the same picture to read 6% of it.
 */
export const wallpaperNeedsDarkText = async (
  wallpaper: Wallpaper,
  src: string = wallpaper.value
): Promise<boolean> => {
  if (wallpaper.type === "gradient") {
    const firstStop = wallpaper.value.match(/#[0-9a-f]{3,6}/i)?.[0];
    const luminance = firstStop ? hexLuminance(firstStop) : null;
    return luminance !== null && luminance > LIGHT_THRESHOLD;
  }

  const luminance = await imageLuminance(src);
  return luminance !== null && luminance > LIGHT_THRESHOLD;
};
