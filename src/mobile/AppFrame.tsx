import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";

import { EXPANDED, collapsedTo } from "#mobile/motion";
import useMobileStore from "#mobile/store";
import { prefersReducedMotion } from "#utils/motion";

/** Far enough up the home bar to read as a flick rather than a stray touch. */
const SWIPE_DISMISS = 40;

interface AppFrameProps {
  title: string;
  /** Given only when there is somewhere to go *within* the app. */
  onBack?: () => void;
  backLabel?: string;
  /** Trailing navigation-bar control — a download button, say. */
  action?: ReactNode;
  /**
   * iOS gives a large title to a screen you scroll and an inline one to a
   * screen you look at. The photo viewer is the second kind: a 34pt heading
   * over a photograph is a caption nobody asked for.
   */
  largeTitle?: boolean;
  children: ReactNode;
}

/**
 * The chrome every full-screen app sits in: navigation bar, scrolling body,
 * home indicator. It also owns the open and dismiss animations, because it is
 * the element being animated.
 */
const AppFrame = ({
  title,
  onBack,
  backLabel = "Back",
  action,
  largeTitle = true,
  children,
}: AppFrameProps) => {
  const origin = useMobileStore((state) => state.origin);
  const closing = useMobileStore((state) => state.closing);
  const finishClose = useMobileStore((state) => state.finishClose);
  const dismiss = useMobileStore((state) => state.dismiss);
  const ref = useRef<HTMLElement>(null);

  /*
   * Whether the large title has gone under the navigation bar, which is what
   * fades the bar's own copy of the title in and draws the hairline beneath it.
   *
   * Watched rather than measured on every scroll event. The alternative is
   * reading scrollTop against the title's height on each frame of a flick,
   * which is both a layout read per frame and a magic number to keep in step
   * with the type; an observer asks the browser to say when the box has left,
   * and says nothing at all while it has not. `rootMargin` is the bar's own
   * height, so "gone" means gone under the bar rather than off the top.
   */
  const bodyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    const bar = barRef.current;
    const heading = titleRef.current;
    if (!body || !bar || !heading) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      {
        root: body,
        rootMargin: `-${Math.round(bar.getBoundingClientRect().height)}px 0px 0px 0px`,
      }
    );

    observer.observe(heading);
    return () => observer.disconnect();
    // The title itself is a dependency: Files renames the heading as you drill
    // in, and a folder with a shorter name can change how tall the box is
  }, [largeTitle, title]);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, EXPANDED);
      return;
    }

    gsap.fromTo(el, collapsedTo(origin), {
      ...EXPANDED,
      duration: 0.42,
      ease: "power3.out",
    });
  }, []);

  useGSAP(() => {
    if (!closing) return;
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    gsap.to(el, {
      ...collapsedTo(origin),
      duration: 0.28,
      ease: "power2.in",
      onComplete: finishClose,
    });
  }, [closing]);

  /** Swipe up anywhere along the home bar, the way the real gesture works. */
  const handleHomeBarPointerDown = (e: React.PointerEvent) => {
    const startY = e.clientY;

    const onMove = (move: PointerEvent) => {
      if (startY - move.clientY < SWIPE_DISMISS) return;
      cleanup();
      dismiss();
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  };

  return (
    <section ref={ref} className="mobile-app">
      <header
        ref={barRef}
        className={clsx("app-bar", largeTitle && "large", collapsed && "scrolled")}
      >
        {onBack ? (
          <button type="button" className="back" onClick={onBack}>
            <ChevronLeft size={22} />
            <span>{backLabel}</span>
          </button>
        ) : (
          <span className="back-spacer" />
        )}

        {/*
          Two titles, one heading. When the large title is on it is the real
          <h1> and this is its echo — hiding it from the accessibility tree
          keeps a screen reader from announcing the screen's name twice, once
          for a heading and once for the thing that fades in when you scroll.
        */}
        {largeTitle ? (
          <p className="bar-title" aria-hidden="true">
            {title}
          </p>
        ) : (
          <h1>{title}</h1>
        )}

        <span className="app-bar-action">{action}</span>
      </header>

      <div ref={bodyRef} className="app-body">
        {largeTitle && (
          <h1 ref={titleRef} className="large-title">
            {title}
          </h1>
        )}

        {children}
      </div>

      <div className="home-bar-area" onPointerDown={handleHomeBarPointerDown}>
        <button
          type="button"
          className="home-bar"
          onClick={dismiss}
          aria-label="Go to Home Screen"
        />
      </div>
    </section>
  );
};

export default AppFrame;
