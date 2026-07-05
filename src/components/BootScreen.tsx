import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const BootScreen = () => {
  const [done, setDone] = useState(false);
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
