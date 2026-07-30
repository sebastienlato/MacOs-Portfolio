import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import useWindowStore from "#store/window";

const MENU_BAR_HEIGHT = 40;
const GAP = 24;

interface Slot {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** Where each window sits in the overview, as a near-square grid. */
const buildSlots = (count: number): Slot[] => {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const dockInset =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--dock-inset")
    ) || 0;

  const top = MENU_BAR_HEIGHT + GAP;
  const areaW = window.innerWidth - GAP * 2;
  const areaH = window.innerHeight - top - dockInset - GAP;
  const cellW = (areaW - GAP * (cols - 1)) / cols;
  const cellH = (areaH - GAP * (rows - 1)) / rows;

  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      cx: GAP + col * (cellW + GAP) + cellW / 2,
      cy: top + row * (cellH + GAP) + cellH / 2,
      w: cellW,
      h: cellH,
    };
  });
};

/**
 * Mission Control: every open window shrinks into a grid so you can pick one.
 *
 * Windows are moved by writing transforms straight onto their elements rather
 * than by threading slot geometry through the window store. They are already
 * animated imperatively with GSAP in WindowWrapper, and the alternative means
 * every window subscribing to a layout it only cares about while this is open.
 */
const MissionControl = () => {
  const missionControl = useWindowStore((state) => state.missionControl);
  const toggleMissionControl = useWindowStore(
    (state) => state.toggleMissionControl
  );
  /** Each window's transform before the overview took over. */
  const restore = useRef(new Map<string, gsap.TweenVars>());

  useGSAP(() => {
    const els = [...document.querySelectorAll<HTMLElement>("main > section[id]")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .filter((el) => el.id in useWindowStore.getState().windows);

    if (!missionControl) {
      // Put everything back exactly where the overview found it
      els.forEach((el) => {
        const prev = restore.current.get(el.id);
        if (!prev) return;
        gsap.to(el, { ...prev, duration: 0.3, ease: "power2.out" });
      });
      restore.current.clear();
      return;
    }

    const slots = buildSlots(els.length);

    els.forEach((el, i) => {
      const slot = slots[i];
      const x = Number(gsap.getProperty(el, "x"));
      const y = Number(gsap.getProperty(el, "y"));
      const scale = Number(gsap.getProperty(el, "scale"));
      restore.current.set(el.id, { x, y, scale });

      // Layout size, unaffected by any transform already applied
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      // Scaling happens about the centre, so the centre is where the maths is
      // simplest: it does not move when scale changes, only when x/y do.
      const rect = el.getBoundingClientRect();
      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;

      const target = Math.min(slot.w / w, slot.h / h, 1);

      gsap.to(el, {
        x: x + (slot.cx - centreX),
        y: y + (slot.cy - centreY),
        scale: target,
        duration: 0.35,
        ease: "power3.out",
      });
    });
  }, [missionControl]);

  if (!missionControl) return null;

  return (
    <div
      className="mission-control"
      onClick={toggleMissionControl}
      aria-label="Mission Control"
    />
  );
};

export default MissionControl;
