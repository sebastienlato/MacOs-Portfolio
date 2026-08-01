import { useEffect, useRef, useState } from "react";
import { locations, NON_DESKTOP_SELECTOR } from "#constants/index";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import useDesktopStore, { type IconOffset } from "#store/desktop";
import { seconds } from "#utils/motion";
import type { FinderItem } from "#types";

const projects = locations.work?.children ?? [];

interface Marquee {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Below this the press is a click, not a drag — no rubber band is drawn. */
const DRAG_THRESHOLD = 4;

/** Icons stay clear of the menu bar, the way they do on a real desktop. */
const MENU_BAR_HEIGHT = 40;

const marqueeFrom = (
  origin: { x: number; y: number },
  x: number,
  y: number
): Marquee => ({
  left: Math.min(origin.x, x),
  top: Math.min(origin.y, y),
  width: Math.abs(x - origin.x),
  height: Math.abs(y - origin.y),
});

const intersects = (band: Marquee, rect: DOMRect) =>
  rect.left < band.left + band.width &&
  rect.right > band.left &&
  rect.top < band.top + band.height &&
  rect.bottom > band.top;

/**
 * A saved offset, pulled back onto the screen if the viewport has shrunk since.
 *
 * An icon parked at the right-hand edge of a wide display would otherwise be
 * off the side of a laptop — and off the side is permanent here, because it is
 * the position that was saved.
 */
const onScreen = (icon: HTMLElement, { x, y }: IconOffset): IconOffset => {
  const rect = icon.getBoundingClientRect();
  // The icon's untranslated origin: where the CSS alone would put it
  const left = rect.left - Number(gsap.getProperty(icon, "x"));
  const top = rect.top - Number(gsap.getProperty(icon, "y"));

  return {
    x: gsap.utils.clamp(-left, window.innerWidth - rect.width - left, x),
    y: gsap.utils.clamp(
      MENU_BAR_HEIGHT - top,
      window.innerHeight - rect.height - top,
      y
    ),
  };
};

const Home = () => {
  const { setActiveLocation } = useLocationStore();
  const { openWindow } = useWindowStore();
  const [selected, setSelected] = useState<number[]>([]);
  const [marquee, setMarquee] = useState<Marquee | null>(null);

  // The marquee runs off raw DOM events, so it reads selection through a ref
  // rather than closing over a value that goes stale mid-drag.
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const handleOpenProjectFinder = (project: FinderItem) => {
    setActiveLocation(project);
    openWindow("finder");
  };

  /** Shift or ⌘ extends the selection; a plain click replaces it. */
  const handleSelect = (project: FinderItem, extend: boolean) =>
    setSelected((current) => {
      if (!extend) return [project.id];
      return current.includes(project.id)
        ? current.filter((id) => id !== project.id)
        : [...current, project.id];
    });

  /*
   * Dragging an icon, and remembering where it was dropped.
   *
   * The offsets are put back before Draggable is created, so it starts from
   * the transform the visitor left rather than snapping to the CSS position
   * on the next drag. useGSAP runs before paint, so there is no flash of the
   * default arrangement first.
   */
  useGSAP(() => {
    const icons = gsap.utils.toArray<HTMLElement>(".folder");
    if (icons.length === 0) return;

    const { icons: saved } = useDesktopStore.getState();

    for (const icon of icons) {
      const offset = saved[Number(icon.dataset.id)];
      if (offset) gsap.set(icon, onScreen(icon, offset));
    }

    /*
     * Whatever a visitor does here has to survive a reload, so the drag is
     * held inside the desktop rather than letting an icon be lost off it.
     *
     * Bounds are read in the offsetParent's coordinate space, not the
     * viewport's. The two differ by however far down the page the desktop
     * starts, and taking them for the same thing let an icon be dropped a
     * menu bar's height below the bottom of the screen.
     */
    const origin = (
      icons[0].offsetParent ?? document.body
    ).getBoundingClientRect();

    const instances = Draggable.create(icons, {
      bounds: {
        top: MENU_BAR_HEIGHT - origin.top,
        left: -origin.left,
        width: window.innerWidth,
        height: window.innerHeight - MENU_BAR_HEIGHT,
      },
      onDragEnd() {
        const icon = this.target as HTMLElement;
        useDesktopStore
          .getState()
          .moveIcon(Number(icon.dataset.id), { x: this.x, y: this.y });
      },
    });

    return () => instances.forEach((instance) => instance.kill());
  }, []);

  /*
   * Clean Up, in the desktop's context menu, empties the store — the icons
   * themselves are still wearing the transforms that put them where they were,
   * so they have to be taken off here. A plain effect rather than useGSAP:
   * this must not be reverted when the dependency changes, since reverting it
   * would put the old offsets straight back on.
   */
  const isTidy = useDesktopStore((state) => Object.keys(state.icons).length === 0);
  useEffect(() => {
    if (!isTidy) return;
    gsap.to(".folder", { x: 0, y: 0, duration: seconds(0.25), ease: "power2.out" });
  }, [isTidy]);

  // Rubber-band selection. Listening on the window rather than on a full-screen
  // overlay keeps the desktop click-through: anything that isn't bare desktop
  // (a window, the dock, an icon) bails out before the drag ever starts.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (target.closest(NON_DESKTOP_SELECTOR) || target.closest(".folder")) {
        return;
      }

      const extend = e.shiftKey || e.metaKey;
      const base = extend ? selectedRef.current : [];
      if (!extend) setSelected([]);

      const origin = { x: e.clientX, y: e.clientY };
      let dragging = false;

      const onMove = (move: PointerEvent) => {
        if (
          !dragging &&
          Math.hypot(move.clientX - origin.x, move.clientY - origin.y) <
            DRAG_THRESHOLD
        ) {
          return;
        }
        dragging = true;

        const band = marqueeFrom(origin, move.clientX, move.clientY);
        setMarquee(band);

        // Rects are read live so icons dragged elsewhere still hit correctly
        const hits = [...document.querySelectorAll<HTMLElement>(".folder")]
          .filter((icon) => intersects(band, icon.getBoundingClientRect()))
          .map((icon) => Number(icon.dataset.id));

        setSelected([...new Set([...base, ...hits])]);
      };

      const onUp = () => {
        setMarquee(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected([]);

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section id="home">
      <ul>
        {projects.map((project) => (
          <li
            key={project.id}
            data-id={project.id}
            className={clsx(
              "group folder",
              project.desktopPosition,
              selected.includes(project.id) && "selected"
            )}
          >
            {/*
              A real button, so the icons are reachable by keyboard at all — as
              bare <li> elements they were pointer-only. Click still selects and
              double-click still opens, the way the desktop works; Enter opens,
              the way everything else on the web does.
            */}
            <button
              type="button"
              aria-label={project.name}
              aria-pressed={selected.includes(project.id)}
              onClick={(e) => handleSelect(project, e.shiftKey || e.metaKey)}
              onDoubleClick={() => handleOpenProjectFinder(project)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                handleOpenProjectFinder(project);
              }}
            >
              <img src="/images/folder.png" alt="" draggable={false} />
              <p>{project.name}</p>
            </button>
          </li>
        ))}
      </ul>

      {marquee && (
        <div
          className="marquee"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
          aria-hidden="true"
        />
      )}
    </section>
  );
};
export default Home;
