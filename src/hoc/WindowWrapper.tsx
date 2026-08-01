import useWindowStore from "#store/window";
import useLayoutStore from "#store/layout";
import useSnapStore from "#store/snap";
import { APP_MENUS } from "#constants/menus";
import { seconds } from "#utils/motion";
import clsx from "clsx";
import { useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import type { WindowKey, WindowTile } from "#types";

const MIN_WIDTH = 360;
const MIN_HEIGHT = 220;
const MENU_BAR_HEIGHT = 40;
/** The dock's own z-index, which a window parked in it has to clear. */
const DOCK_Z = 9500;
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

/**
 * The offsets and scale that land a window on its slot in the dock.
 *
 * Measured from `offsetLeft`/`offsetTop` and the layout size — the one part of
 * the geometry no transform touches — rather than from the window's current
 * rect. The answer is then the same whatever the window is already wearing, so
 * asking twice cannot move it twice.
 *
 * That matters more than it sounds. With reduced motion the flight has no
 * duration, and a second measurement taken in the same tick reads a rect that
 * has not caught up with the transform GSAP has already set: the old centre
 * against the new offset, which threw the window a full screen past the dock.
 */
const flightTo = (el: HTMLElement, slot: HTMLElement) => {
  const to = slot.getBoundingClientRect();

  // A tiled window is fixed, so its offsets are already viewport coordinates
  const parent = el.offsetParent as HTMLElement | null;
  const origin = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };

  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const left = origin.left + el.offsetLeft;
  const top = origin.top + el.offsetTop;

  return {
    // Scaling happens about the centre, which is therefore the only point that
    // does not move when the scale does
    x: to.left + to.width / 2 - (left + width / 2),
    y: to.top + to.height / 2 - (top + height / 2),
    scale: Math.min(to.width / width, to.height / height),
  };
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
    /**
     * Lifted above the dock, which floats over the windows. True for the whole
     * round trip, not just while parked — dropping it the moment a window is
     * un-minimized would have it fly out from *behind* the slab it was sitting
     * on top of a frame earlier.
     */
    const [elevated, setElevated] = useState(false);
    /** True once the flight has landed, so re-seating cannot cut it short. */
    const parked = useRef(false);

    /**
     * Minimizing or restoring another window re-flows the dock and carries
     * this one's slot with it — as does resizing the viewport. Counting them
     * is enough to notice: the number only changes when the row does.
     */
    const minimizedCount = useWindowStore(
      (state) =>
        Object.values(state.windows).filter(
          (win) => win.isOpen && win.isMinimized
        ).length
    );

    const saveLayout = (layout: Partial<{ x: number; y: number; w: number; h: number }>) =>
      useLayoutStore.getState().saveLayout(windowKey, layout);

    const dockSlot = () =>
      document.querySelector<HTMLElement>(`[data-dock-slot="${windowKey}"]`);

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
        { scale: 1, opacity: 1, y, duration: seconds(0.4), ease: "power3.out" }
      );
    }, [isOpen]);

    /*
     * Minimize, into the dock rather than into nothing.
     *
     * The window itself is what parks in the dock — scaled down and left
     * there, the way Mission Control moves the real elements instead of
     * drawing stand-ins. That is what makes the thumbnail a live picture of
     * the window rather than its app icon: it *is* the window.
     *
     * The dock renders an empty slot for each minimized window and the flight
     * lands on it, so the dock opening a gap and the window arriving in it are
     * one movement.
     */
    useGSAP(() => {
      const el = ref.current;
      if (!el || !isOpen) return;

      if (isMinimized) {
        // Where to come back to. Read before the flight overwrites it, and
        // only when free-floating: a tiled window is placed by CSS
        if (!tile) {
          saveLayout({
            x: Number(gsap.getProperty(el, "x")),
            y: Number(gsap.getProperty(el, "y")),
          });
        }

        setElevated(true);

        const slot = dockSlot();
        // No slot means no dock — below sm it is hidden entirely, and there is
        // nowhere for a window to go but away
        if (!slot) {
          gsap.to(el, {
            scale: 0.4,
            opacity: 0,
            y: window.innerHeight,
            duration: seconds(0.35),
            ease: "power2.in",
          });
          return;
        }

        const { x, y, scale } = flightTo(el, slot);

        /*
         * Three overlapping tweens, because a genie is not one movement:
         *
         *   1. the window narrows, before it has gone anywhere — the neck
         *   2. it sinks toward the dock, shrinking as it goes
         *   3. it slides along to the slot, and later than it sinks
         *
         * Splitting x from y is what curves the path. Both are `in` eases, but
         * a gentler one on y means the drop is well underway before the slide
         * starts, so the window is pulled *down into* the dock rather than
         * thrown at it in a straight line.
         */
        const flight = gsap.timeline();
        flight
          .to(el, {
            scaleX: 0.55,
            duration: seconds(0.16),
            ease: "power2.in",
          })
          .to(
            el,
            {
              y,
              scale,
              opacity: 0.9,
              duration: seconds(0.34),
              ease: "power1.in",
            },
            seconds(0.1)
          )
          .to(
            el,
            {
              x,
              duration: seconds(0.34),
              ease: "power3.in",
              onComplete: () => {
                parked.current = true;
              },
            },
            seconds(0.1)
          );

        return;
      }

      parked.current = false;

      const layout = useLayoutStore.getState().layouts[windowKey];

      gsap.to(el, {
        scale: 1,
        opacity: 1,
        // A tiled window is pinned by CSS, so it goes home to no offset at all
        x: tile ? 0 : (layout?.x ?? 0),
        y: tile ? 0 : (layout?.y ?? 0),
        duration: seconds(0.35),
        ease: "power2.out",
        // Stays above the dock for the whole trip out, or it would appear from
        // behind the slab it was just sitting on top of
        onComplete: () => setElevated(false),
      });
      // `tile` is read, not depended on: re-running this on a tile change
      // would fly an un-minimized window across the screen for no reason
    }, [isMinimized]);

    /*
     * A parked window follows its slot when the dock re-flows underneath it.
     * Without this, minimizing a second window shifts every slot along and
     * leaves the thumbnails behind at the addresses those slots used to have.
     *
     * `parked` gates it: the same change that adds a slot is the one that
     * starts the flight, and a re-seat firing then would cut the genie short
     * by dropping the window straight onto its destination.
     */
    useGSAP(() => {
      const el = ref.current;
      if (!el || !isMinimized) return;

      const reseat = () => {
        const slot = dockSlot();
        if (!slot || !parked.current) return;
        gsap.to(el, {
          ...flightTo(el, slot),
          duration: seconds(0.2),
          ease: "power2.out",
        });
      };

      reseat();
      window.addEventListener("resize", reseat);
      return () => window.removeEventListener("resize", reseat);
    }, [isMinimized, minimizedCount]);

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
      // Closing a *parked* window skips the flight home that would normally
      // put this back, and a window reopened afterwards would sit above the
      // dock for the rest of the visit
      setElevated(false);
      parked.current = false;
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
        style={{ zIndex: elevated ? DOCK_Z + 1 : zIndex }}
        /* A labelled section is a region landmark, which is how a screen
           reader user gets a list of the open windows and jumps between them */
        aria-label={APP_MENUS[windowKey].name}
        /* Parked in the dock, it is a thumbnail — tabbing into one would put
           focus inside something 6% of full size, off where nobody can see */
        inert={isMinimized}
        onMouseDown={() => focusWindow(windowKey)}
        className={clsx(
          "absolute",
          tile && `tiled tile-${tile}`,
          isFocused && "is-focused",
          // Parked in the dock: the slot underneath takes the click
          isMinimized && "minimized"
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
