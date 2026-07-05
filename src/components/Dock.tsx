import { useRef } from "react";
import { Tooltip } from "react-tooltip";
import gsap from "gsap";

import { dockApps, locations } from "#constants/index";
import { useGSAP } from "@gsap/react";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import type { DockApp, WindowKey } from "#types";

const isWindowKey = (id: string): id is WindowKey =>
  id in useWindowStore.getState().windows;

const Dock = () => {
  const { openWindow, focusWindow, windows } = useWindowStore();
  const { setActiveLocation } = useLocationStore();
  const dockRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const icons = dock.querySelectorAll<HTMLElement>(".dock-icon");

    const animateIcons = (mouseX: number) => {
      const { left } = dock.getBoundingClientRect();

      icons.forEach((icon) => {
        const { left: iconLeft, width } = icon.getBoundingClientRect();
        const center = iconLeft - left + width / 2;
        const distance = Math.abs(mouseX - center);

        const intensity = Math.exp(-(distance ** 2.5) / 20000);

        gsap.to(icon, {
          scale: 1 + 0.25 * intensity,
          y: -15 * intensity,
          duration: 0.2,
          ease: "power1.out",
        });
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { left } = dock.getBoundingClientRect();

      animateIcons(e.clientX - left);
    };

    const resetIcons = () =>
      icons.forEach((icon) =>
        gsap.to(icon, {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "power1.out",
        })
      );

    dock.addEventListener("mousemove", handleMouseMove);
    dock.addEventListener("mouseleave", resetIcons);

    return () => {
      dock.removeEventListener("mousemove", handleMouseMove);
      dock.removeEventListener("mouseleave", resetIcons);
    };
  }, []);

  const toggleApp = (app: Pick<DockApp, "id" | "canOpen">) => {
    // Trash opens the Finder pointed at the Trash location, like the real dock
    if (app.id === "trash") {
      setActiveLocation(locations.trash);
      openWindow("finder");
      return;
    }

    if (!app.canOpen || !isWindowKey(app.id)) return;

    const win = windows[app.id];

    // macOS behavior: clicking a running app focuses/restores it, never closes
    if (win.isOpen && !win.isMinimized) {
      focusWindow(app.id);
    } else {
      openWindow(app.id);
    }
  };

  return (
    <section id="dock">
      <div ref={dockRef} className="dock-container">
        {dockApps.map(({ id, name, icon, canOpen }) => (
          <div key={id} className="relative flex justify-center">
            <button
              type="button"
              className="dock-icon"
              aria-label={name}
              data-tooltip-id="dock-tooltip"
              data-tooltip-content={name}
              data-tooltip-delay-show={150}
              disabled={!canOpen}
              onClick={() => toggleApp({ id, canOpen })}
            >
              <img src={`/images/${icon}`} alt={name} loading="lazy" />
            </button>
            {isWindowKey(id) && windows[id].isOpen && (
              <span className="running-dot" />
            )}
          </div>
        ))}
        <Tooltip id="dock-tooltip" place="top" className="tooltip" />
      </div>
    </section>
  );
};

export default Dock;
