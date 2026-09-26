import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { prefersReducedMotion } from "#utils/motion";

// Letters thicken toward the pointer and settle back to the resting weight
const FONT_WEIGHT = { min: 400, max: 900, default: 400 };

const renderText = (text: string, className: string, baseWeight = 400) => {
  return [...text].map((char, i) => (
    <span
      key={i}
      className={className}
      style={{ fontVariationSettings: `'wght' ${baseWeight}` }}
    >
      {char === " " ? " " : char}
    </span>
  ));
};

const setupTextHover = (container: HTMLElement | null) => {
  // Letters thickening under the pointer is the definition of decorative motion
  if (!container || prefersReducedMotion()) return () => {};

  const letters = container.querySelectorAll("span");
  const { min, max, default: base } = FONT_WEIGHT;

  const animateLetter = (
    letter: HTMLElement,
    weight: number,
    duration = 0.25
  ) => {
    return gsap.to(letter, {
      duration,
      ease: "power2.out",
      fontVariationSettings: `'wght' ${weight} `,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { left } = container.getBoundingClientRect();
    const mouseX = e.clientX - left;

    letters.forEach((letter) => {
      const { left: l, width: w } = letter.getBoundingClientRect();
      const distance = Math.abs(mouseX - (l - left + w / 2));
      const intensity = Math.exp(-(distance ** 2) / 20000);

      animateLetter(letter, min + (max - min) * intensity);
    });
  };
  const handleMouseLeave = () =>
    letters.forEach((letter) => animateLetter(letter, base, 0.3));

  container.addEventListener("mousemove", handleMouseMove);
  container.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    container.removeEventListener("mousemove", handleMouseMove);
    container.removeEventListener("mouseleave", handleMouseLeave);
  };
};

const Welcome = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => setupTextHover(titleRef.current), []);

  return (
    <section id="welcome">
      <h1 ref={titleRef}>
        {renderText("portfolio", "text-9xl italic font-georama")}
      </h1>
    </section>
  );
};
export default Welcome;
