import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { prefersReducedMotion } from "#utils/motion";

/** How long each beat of the sequence runs, in seconds. */
const BAR_DURATION = 1.6;
const FADE_DELAY = 0.15;
const FADE_DURATION = 0.45;

/**
 * The whole sequence in milliseconds, derived rather than written down twice —
 * the deadline below has to stay in step with the timeline it is guarding, and
 * a second hard-coded number is exactly the kind that drifts.
 */
const BOOT_MS = (BAR_DURATION + FADE_DELAY + FADE_DURATION) * 1000;

/** Slack, so a merely busy frame is never mistaken for a stalled one. */
const GRACE_MS = 300;

/**
 * Drives the boot screen and then takes it away.
 *
 * The screen itself is markup in `index.html`, not JSX — see the comment
 * there. Painting it from the document rather than from React is what lets it
 * appear before the bundle has arrived, which is the whole point of it. This
 * adopts that node instead of rendering a second copy, so there is no moment
 * where one is swapped for the other.
 *
 * The logo no longer fades in. It is already on screen by the time any of this
 * runs, and fading in something the visitor is looking at reads as a flicker.
 */
const BootScreen = () => {
  useGSAP(() => {
    const screen = document.getElementById("boot-screen");
    // Gone already — StrictMode runs this twice in development
    if (!screen) return;

    const remove = () => screen.remove();

    /*
     * Asking for less motion skips the sequence outright rather than making it
     * instant. Collapsing the durations to zero was the obvious move and does
     * not work: a GSAP timeline with no length never fires onComplete, so the
     * screen would stay up for ever — which is how this arrived as a hang
     * rather than as a jump.
     */
    if (prefersReducedMotion()) {
      remove();
      return;
    }

    const timeline = gsap
      .timeline({ onComplete: remove })
      .to(screen.querySelector(".bar"), {
        width: "100%",
        duration: BAR_DURATION,
        ease: "power1.inOut",
      })
      .to(screen, { opacity: 0, duration: FADE_DURATION, delay: FADE_DELAY });

    /*
     * The timeline above cannot be trusted to finish on its own, because GSAP
     * runs on requestAnimationFrame and a background tab throttles that to
     * nothing. Open this in a tab you are not looking at — a cmd-click from a
     * CV, a link unfurled in Slack — and the bar freezes a fifth of the way
     * across and stays there. Nothing is behind it yet, so the visitor comes
     * back to a black screen with an Apple logo on it and watches the machine
     * "boot" only once they arrive, which is the opposite of the intent: this
     * stands for a wait that has already happened.
     *
     * So the deadline is kept on the wall clock instead. `setTimeout` is
     * throttled in a hidden tab too, but throttled to roughly a second rather
     * than to a standstill, and it still fires — which is all this needs.
     *
     * Being visible when it fires is the one case that is left alone. Someone
     * is watching the animation, so it plays out to the end; that also covers
     * the tab that starts hidden and is brought forward part-way through,
     * where GSAP picks up where it left off and simply finishes late.
     */
    const deadline = window.setTimeout(() => {
      if (!document.hidden) return;
      timeline.kill();
      remove();
    }, BOOT_MS + GRACE_MS);

    return () => window.clearTimeout(deadline);
  }, []);

  return null;
};

export default BootScreen;
