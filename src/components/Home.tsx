import { useEffect, useRef, useState } from "react";
import { locations, NON_DESKTOP_SELECTOR } from "#constants/index";
import clsx from "clsx";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
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

  useGSAP(() => {
    Draggable.create(".folder");
  }, []);

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
              project.windowPosition,
              selected.includes(project.id) && "selected"
            )}
            onClick={(e) => handleSelect(project, e.shiftKey || e.metaKey)}
            onDoubleClick={() => handleOpenProjectFinder(project)}
          >
            <img src="/images/folder.png" alt={project.name} draggable={false} />
            <p>{project.name}</p>
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
