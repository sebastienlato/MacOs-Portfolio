import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
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
  children,
}: AppFrameProps) => {
  const origin = useMobileStore((state) => state.origin);
  const closing = useMobileStore((state) => state.closing);
  const finishClose = useMobileStore((state) => state.finishClose);
  const dismiss = useMobileStore((state) => state.dismiss);
  const ref = useRef<HTMLElement>(null);

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
      <header className="app-bar">
        {onBack ? (
          <button type="button" className="back" onClick={onBack}>
            <ChevronLeft size={22} />
            <span>{backLabel}</span>
          </button>
        ) : (
          <span className="back-spacer" />
        )}

        <h1>{title}</h1>

        <span className="app-bar-action">{action}</span>
      </header>

      <div className="app-body">{children}</div>

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
