import useWindowStore from "#store/window";
import clsx from "clsx";
import { useLayoutEffect, useRef, type ComponentType } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import type { WindowKey } from "#types";

const MIN_WIDTH = 360;
const MIN_HEIGHT = 220;

const WindowWrapper = <P extends object>(
  Component: ComponentType<P>,
  windowKey: WindowKey
) => {
  const Wrapped = (props: P) => {
    const { focusWindow, windows } = useWindowStore();
    const { isOpen, isMinimized, isMaximized, zIndex } = windows[windowKey];
    const ref = useRef<HTMLElement>(null);

    useGSAP(() => {
      const el = ref.current;
      if (!el || !isOpen) return;

      // Clear the inline "none" so CSS controls display (block, or flex once resized)
      el.style.removeProperty("display");

      gsap.fromTo(
        el,
        { scale: 0.8, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
    }, [isOpen]);

    // Genie-ish minimize: shrink toward the dock, then hide
    useGSAP(() => {
      const el = ref.current;
      if (!el || !isOpen) return;

      if (isMinimized) {
        gsap.to(el, {
          scale: 0.4,
          opacity: 0,
          y: window.innerHeight,
          duration: 0.35,
          ease: "power2.in",
          onComplete: () => {
            el.style.display = "none";
          },
        });
      } else {
        el.style.removeProperty("display");
        gsap.to(el, {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    }, [isMinimized]);

    useGSAP(() => {
      const el = ref.current;
      if (!el) return;

      if (isMaximized) {
        // Fullscreen windows are pinned below the menu bar, not draggable
        gsap.set(el, { x: 0, y: 0 });
        return;
      }

      // Like real macOS, windows are dragged by their title bar
      const header = el.querySelector<HTMLElement>("#window-header");

      const [instance] = Draggable.create(el, {
        trigger: header ?? el,
        onPress: () => focusWindow(windowKey),
      });

      return () => instance.kill();
    }, [isMaximized]);

    // Only handles closed windows; opening and minimizing animate via GSAP above
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || isOpen) return;
      el.style.display = "none";
    }, [isOpen]);

    const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || isMaximized) return;

      e.preventDefault();
      e.stopPropagation();
      focusWindow(windowKey);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = el.offsetWidth;
      const startHeight = el.offsetHeight;

      const onMove = (ev: PointerEvent) => {
        el.classList.add("user-resized");
        el.style.width = `${Math.max(MIN_WIDTH, startWidth + ev.clientX - startX)}px`;
        el.style.height = `${Math.max(MIN_HEIGHT, startHeight + ev.clientY - startY)}px`;
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    return (
      <section
        id={windowKey}
        ref={ref}
        style={{ zIndex }}
        onMouseDown={() => focusWindow(windowKey)}
        className={clsx("absolute", isMaximized && "maximized")}
      >
        <Component {...props} />
        <div
          className="resize-handle"
          onPointerDown={handleResizeStart}
          aria-hidden="true"
        />
      </section>
    );
  };

  Wrapped.displayName = `WindowWrapper(${
    Component.displayName || Component.name || "Component"
  })`;

  return Wrapped;
};

export default WindowWrapper;
