/**
 * Whether the visitor has asked their system for less movement.
 *
 * Read at call time rather than cached, so flipping the setting takes effect on
 * the next animation instead of on the next reload.
 */
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A tween's length in seconds, collapsed to zero when less motion was asked for.
 *
 * Zero is deliberate rather than "skip the tween": GSAP still applies every
 * end value and still fires onComplete, so the thing arrives where it was going
 * without travelling there. Anything that reads as motion on its own — the dock
 * magnifying, the hero's letters thickening — is turned off outright instead,
 * since arriving instantly at a scaled-up icon is not what was asked for either.
 */
export const seconds = (value: number) => (prefersReducedMotion() ? 0 : value);
