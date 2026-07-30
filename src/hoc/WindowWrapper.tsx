import useWindowStore from "#store/window";
import useLayoutStore from "#store/layout";
import useSnapStore from "#store/snap";
import clsx from "clsx";
import { useLayoutEffect, useRef, type ComponentType } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import type { WindowKey, WindowTile } from "#types";

const MIN_WIDTH = 360;
const MIN_HEIGHT = 220;
const MENU_BAR_HEIGHT = 40;
/** How much of a window must stay reachable when restoring a saved position. */
const EDGE_MARGIN = 100;
/** Gap kept around a window the first time it is placed. */
const VIEWPORT_MARGIN = 12;
/** How close to an edge the pointer must get before that edge arms. */
const SNAP_ZONE = 26;

/**
 * Which region a drag would tile into, from the pointer alone — the window's
 * own box is the wrong thing to test, since you can hold a wide window's title
 * bar anywhere along it.
 *
 * The top edge wins over the sides so the corners resolve to Fill, which is
 * what the gesture reads as when you throw a window at the menu bar.
 */
const snapZoneFor = (x: number, y: number): WindowTile | null => {
  if (y <= MENU_BAR_HEIGHT + SNAP_ZONE) return "fill";
  if (x <= SNAP_ZONE) return "left";
  if (x >= window.innerWidth - SNAP_ZONE) return "right";
  return null;
};

const WindowWrapper = <P extends object>(
  Component: ComponentType<P>,
  windowKey: WindowKey
) => {
  const Wrapped = (props: P) => {
    const { focusWindow, windows, activeWindow } = useWindowStore();
    const { isOpen, isMinimized, tile, hasOpened, zIndex } =
      windows[windowKey];
    const isFocused = activeWindow === windowKey;
    const ref = useRef<HTMLElement>(null);

    const saveLayout = (layout: Partial<{ x: number; y: number; w: number; h: number }>) =>
      useLayoutStore.getState().saveLayout(windowKey, layout);

    /**
     * Applies the persisted size, then returns the offsets to open at.
     *
     * A saved position is only nudged far enough to stay reachable — the
     * visitor put it there deliberately. A window opening for the first time
     * keeps its designed CSS position, pulled onto the screen when that
     * position would hang off the edge of a smaller viewport.
     */
    const restoreLayout = (el: HTMLElement) => {
      const layout = useLayoutStore.getState().layouts[windowKey];

      if (layout?.w && layout.h) {
        el.classList.add("user-resized");
        el.style.width = `${layout.w}px`;
        el.style.height = `${layout.h}px`;
      }

      // The element's untranslated origin: current rect minus current offsets
      const rect = el.getBoundingClientRect();
      const baseLeft = rect.left - Number(gsap.getProperty(el, "x"));
      const baseTop = rect.top - Number(gsap.getProperty(el, "y"));

      if (!layout) {
        // Offsets that would sit the window flush against each edge
        const left = VIEWPORT_MARGIN - baseLeft;
        const right = window.innerWidth - VIEWPORT_MARGIN - rect.width - baseLeft;
        const top = MENU_BAR_HEIGHT + VIEWPORT_MARGIN - baseTop;
        const bottom =
          window.innerHeight - VIEWPORT_MARGIN - rect.height - baseTop;

        // Start from the CSS position and pull in only where it overflows. When
        // the window is bigger than the viewport the lower bound wins, which
        // favours the top-left corner so the title bar stays grabbable.
        return {
          x: Math.max(left, Math.min(0, right)),
          y: Math.max(top, Math.min(0, bottom)),
        };
      }

      let { x, y } = layout;
      x = Math.min(x, window.innerWidth - baseLeft - EDGE_MARGIN);
      x = Math.max(x, EDGE_MARGIN - baseLeft - rect.width);
      y = Math.max(y, MENU_BAR_HEIGHT - baseTop);
      y = Math.min(y, window.innerHeight - baseTop - EDGE_MARGIN);
      return { x, y };
    };

    useGSAP(() => {
      const el = ref.current;
      if (!el || !isOpen) return;

      // Clear the inline "none" so CSS controls display (block, or flex once resized)
      el.style.removeProperty("display");

      const { x, y } = restoreLayout(el);

      gsap.fromTo(
        el,
        { scale: 0.8, opacity: 0, x, y: y + 40 },
        { scale: 1, opacity: 1, y, duration: 0.4, ease: "power3.out" }
      );
    }, [isOpen]);

    // Genie-ish minimize: shrink toward the dock, then hide
    useGSAP(() => {
      const el = ref.current;
      if (!el || !isOpen) return;

      if (isMinimized) {
        saveLayout({
          x: Number(gsap.getProperty(el, "x")),
          y: Number(gsap.getProperty(el, "y")),
        });
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
          y: useLayoutStore.getState().layouts[windowKey]?.y ?? 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    }, [isMinimized]);

    useGSAP(() => {
      const el = ref.current;
      if (!el) return;

      if (tile) {
        // Tiled windows are pinned by CSS and not draggable. Zero the percent
        // offsets too: GSAP tracks those separately from x/y
        gsap.set(el, { x: 0, y: 0, xPercent: 0, yPercent: 0 });
        return;
      }

      // Like real macOS, windows are dragged by their title bar
      const header = el.querySelector<HTMLElement>("#window-header");

      const [instance] = Draggable.create(el, {
        trigger: header ?? el,
        onPress: () => focusWindow(windowKey),
        // Held against an edge, the window tiles there on release
        onDrag: () =>
          useSnapStore
            .getState()
            .setZone(snapZoneFor(instance.pointerX, instance.pointerY)),
      });

      instance.addEventListener("dragend", () => {
        const { zone, setZone } = useSnapStore.getState();
        setZone(null);

        if (zone) {
          // Clear the drag's transform here rather than leaving it to the tile
          // effect. Tiling positions with CSS left/width, which a leftover
          // translate offsets — the window landed 121px right of the edge.
          gsap.set(el, { x: 0, y: 0, xPercent: 0, yPercent: 0 });

          // Tiling owns the geometry from here, so the drag offset is discarded
          // rather than saved — restoring later should use the pre-drag spot.
          useWindowStore.getState().tileWindow(windowKey, zone);
          return;
        }

        saveLayout({ x: instance.x, y: instance.y });
      });

      return () => {
        // A drag interrupted by an unmount would otherwise strand the ghost
        useSnapStore.getState().setZone(null);
        instance.kill();
      };
      // hasOpened is a dependency because the element does not exist until the
      // first open — without it the Draggable would never be created.
    }, [tile, hasOpened]);

    // Only handles closed windows; opening and minimizing animate via GSAP above
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || isOpen) return;
      el.style.display = "none";
    }, [isOpen]);

    const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || tile) return;

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
        saveLayout({ w: el.offsetWidth, h: el.offsetHeight });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    // Nothing to show until the window has been opened at least once. Every
    // hook above still runs, so this stays a valid conditional return.
    if (!hasOpened) return null;

    return (
      <section
        id={windowKey}
        ref={ref}
        style={{ zIndex }}
        onMouseDown={() => focusWindow(windowKey)}
        className={clsx(
          "absolute",
          tile && `tiled tile-${tile}`,
          isFocused && "is-focused"
        )}
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
