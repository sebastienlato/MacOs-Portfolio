import type { Theme, Wallpaper } from "#types";

/**
 * The file a wallpaper actually paints with, for this screen and appearance.
 *
 * Two axes. A dynamic wallpaper — macOS 27's default is one — has a second
 * picture for Dark, and follows the appearance the way the real one does. And
 * the phone takes the smaller copy wherever there is one.
 *
 * One function for every consumer, because the menu bar's luminance sampler
 * has to read exactly the file on screen: pointed at a different copy, it both
 * fetched a second image and judged the bar against the wrong one.
 */
export const wallpaperSource = (
  wallpaper: Wallpaper,
  { mobile = false, theme = "light" }: { mobile?: boolean; theme?: Theme } = {}
): string => {
  if (wallpaper.type === "gradient") return wallpaper.value;

  const dark = theme === "dark" && wallpaper.dark;
  if (dark) return (mobile && dark.mobileValue) || dark.value;

  return (mobile && wallpaper.mobileValue) || wallpaper.value;
};

/** As a CSS `background-image`, which is how both shells paint it. */
export const wallpaperBackground = (
  wallpaper: Wallpaper,
  options?: Parameters<typeof wallpaperSource>[1]
): string => {
  const src = wallpaperSource(wallpaper, options);
  return wallpaper.type === "gradient" ? src : `url(${src})`;
};
