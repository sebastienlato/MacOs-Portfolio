import { useEffect } from "react";

import { prefersReducedMotion } from "#utils/motion";

/** How long each beat of the sequence runs, in seconds. Mirrors `index.html`. */
const BAR_DURATION = 1.6;
const FADE_DELAY = 0.15;
const FADE_DURATION = 0.45;

/**
 * The whole sequence in milliseconds, derived rather than written down twice —
 * the deadline below has to stay in step with the animation it is guarding, and
 * a second hard-coded number is exactly the kind that drifts.
 */
const BOOT_MS = (BAR_DURATION + FADE_DELAY + FADE_DURATION) * 1000;

/**
 * Takes the boot screen away. It no longer drives it.
 *
 * The screen is markup *and* animation in `index.html` — see the comment
 * there. It used to be animated here with GSAP, which meant the sequence could
 * not begin until the bundle had downloaded, parsed and mounted React: 2.2s of
 * "booting" that ran after the network rather than during it, and a Home Screen
 * that arrived 2.2s later than it had to. Under Lighthouse's mobile throttling
 * that showed up as a Speed Index of 6.9s against a Largest Contentful Paint of
 * 2.6s — four seconds of the screen still changing after the content was there.
 *
 * As a CSS animation it starts at first paint, so by the time this component
 * exists the sequence is usually over and there is nothing left to wait for.
 */
const BootScreen = () => {
  useEffect(() => {
    const screen = document.getElementById("boot-screen");
    // Gone already — StrictMode runs this twice in development
    if (!screen) return;

    const remove = () => screen.remove();

    // The CSS skips the sequence under this too, so there is nothing to outlast
    if (prefersReducedMotion()) {
      remove();
      return;
    }

    /*
     * `performance.now()` is milliseconds since the navigation started, which
     * is as near as makes no difference to when the animation started — so what
     * is left of the sequence is what has not already elapsed. On a slow
     * connection that is nothing at all and the screen goes immediately, which
     * is the whole point: the wait it stands for has already been had.
     *
     * A timer rather than `animationend`, because the tab may never have been
     * looked at. CSS animations are throttled to a standstill in a background
     * tab exactly as rAF is, so the event can simply never arrive — a
     * cmd-clicked link would sit on a black screen with an Apple logo until the
     * visitor came to it, and then watch the machine boot on arrival. That is
     * the opposite of the intent. `setTimeout` is throttled in a hidden tab too,
     * but to roughly a second rather than to nothing, and it still fires.
     */
    const remaining = Math.max(0, BOOT_MS - performance.now());
    const deadline = window.setTimeout(remove, remaining);

    return () => window.clearTimeout(deadline);
  }, []);

  return null;
};

export default BootScreen;
