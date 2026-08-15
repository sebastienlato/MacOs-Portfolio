import type { OpenOrigin } from "#mobile/store";

/**
 * The app's collapsed state: the shape it grows out of when opened, and shrinks
 * back into when dismissed.
 *
 * The radius is the fiddly part. A border-radius on a scaled element paints
 * scaled too, so it is set to what renders as the icon's own corner once the
 * scale is applied — `0.23 × viewport` lands at roughly a tile's radius for any
 * tile size, since the scale is itself tile-width over viewport-width.
 */
export const collapsedTo = (origin: OpenOrigin | null): gsap.TweenVars => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // No icon to zoom from — a deep link opened cold, say. Fall back to a plain
  // rise, which is what iOS does when an app is opened from somewhere else.
  if (!origin) return { opacity: 0, scale: 0.94, x: 0, y: 0, borderRadius: 28 };

  return {
    opacity: 0,
    scale: origin.width / w,
    x: origin.x + origin.width / 2 - w / 2,
    y: origin.y + origin.height / 2 - h / 2,
    borderRadius: 0.23 * w,
  };
};

export const EXPANDED: gsap.TweenVars = {
  opacity: 1,
  scale: 1,
  x: 0,
  y: 0,
  borderRadius: 0,
};
