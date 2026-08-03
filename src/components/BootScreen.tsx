import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { prefersReducedMotion } from "#utils/motion";

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

    gsap
      .timeline({ onComplete: remove })
      .to(screen.querySelector(".bar"), {
        width: "100%",
        duration: 1.6,
        ease: "power1.inOut",
      })
      .to(screen, { opacity: 0, duration: 0.45, delay: 0.15 });
  }, []);

  return null;
};

export default BootScreen;
