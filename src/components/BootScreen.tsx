import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { prefersReducedMotion } from "#utils/motion";

const BootScreen = () => {
  /*
   * The boot screen is motion and nothing else, so asking for less of it skips
   * the sequence outright and the desktop is simply there.
   *
   * Collapsing the durations to zero was the obvious move and does not work: a
   * GSAP timeline with no length never fires onComplete, so the screen would
   * stay up forever — which is how this arrived as a hang rather than a jump.
   */
  const [done, setDone] = useState(prefersReducedMotion);
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    const bar = barRef.current;
    const logo = logoRef.current;
    if (!container || !bar || !logo) return;

    const tl = gsap.timeline({ onComplete: () => setDone(true) });

    tl.fromTo(logo, { opacity: 0 }, { opacity: 1, duration: 0.5 })
      .fromTo(
        bar,
        { width: "0%" },
        { width: "100%", duration: 1.6, ease: "power1.inOut" },
        "-=0.1"
      )
      .to(container, { opacity: 0, duration: 0.45, delay: 0.15 });
  }, []);

  if (done) return null;

  return (
    <div ref={containerRef} className="boot-screen" aria-hidden="true">
      <img ref={logoRef} src="/images/logo.svg" alt="" />
      <div className="progress">
        <div ref={barRef} className="bar" />
      </div>
    </div>
  );
};

export default BootScreen;
