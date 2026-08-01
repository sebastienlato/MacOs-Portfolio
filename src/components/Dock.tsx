import {
  Fragment,
  useCallback,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Tooltip } from "react-tooltip";
import gsap from "gsap";

import { dockApps, locations } from "#constants/index";
import { APP_MENUS } from "#constants/menus";
import { useGSAP } from "@gsap/react";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import ContextMenu, { type ContextMenuItem } from "#components/ContextMenu";
import { prefersReducedMotion } from "#utils/motion";
import type { DockApp, WindowKey } from "#types";

const isWindowKey = (id: string): id is WindowKey =>
  id in useWindowStore.getState().windows;

interface DockMenuState {
  app: DockApp;
  x: number;
  y: number;
}

const Dock = () => {
  const { openWindow, focusWindow, closeWindow, minimizeWindow, windows } =
    useWindowStore();
  const { setActiveLocation, trashItems, emptyTrash } = useLocationStore();
  const dockRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<DockMenuState | null>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  /*
   * Minimized windows live to the right of the divider, beside Trash, where
   * macOS keeps them. Each gets an empty slot; the window itself flies in and
   * parks on top of it, so what you see there is the window rather than a
   * picture of it — see WindowWrapper.
   *
   * Ordered by the window table rather than by when each was minimized, so a
   * thumbnail never changes places under the pointer.
   */
  const minimized = (Object.keys(windows) as WindowKey[]).filter(
    (key) => windows[key].isOpen && windows[key].isMinimized
  );

  useGSAP(() => {
    const dock = dockRef.current;
    if (!dock) return;

    // Magnification is motion for its own sake — an icon that leaps to full
    // size without travelling is no better, so it is simply not wired up
    if (prefersReducedMotion()) return;

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

  const openTrash = () => {
    setActiveLocation(locations.trash);
    openWindow("finder");
  };

  const toggleApp = (app: Pick<DockApp, "id" | "canOpen">) => {
    // Trash opens the Finder pointed at the Trash location, like the real dock
    if (app.id === "trash") return openTrash();

    if (!app.canOpen || !isWindowKey(app.id)) return;

    const win = windows[app.id];

    // macOS behavior: clicking a running app focuses/restores it, never closes
    if (win.isOpen && !win.isMinimized) {
      focusWindow(app.id);
    } else {
      openWindow(app.id);
    }
  };

  /** The menu macOS shows on a dock icon, minus the parts we can't do. */
  const menuItems = (app: DockApp): ContextMenuItem[] => {
    if (app.id === "trash") {
      return [
        { id: "open", label: "Open", onSelect: openTrash },
        { id: "d1", divider: true },
        {
          id: "empty",
          label: "Empty Trash",
          disabled: trashItems.length === 0,
          onSelect: emptyTrash,
        },
      ];
    }

    if (!isWindowKey(app.id)) return [];

    const key = app.id;
    const win = windows[key];
    const isVisible = win.isOpen && !win.isMinimized;

    return [
      isVisible
        ? { id: "hide", label: "Hide", onSelect: () => minimizeWindow(key) }
        : {
            id: "open",
            // openWindow un-minimizes, so one action covers both
            label: win.isOpen ? "Show" : "Open",
            onSelect: () => openWindow(key),
          },
      { id: "d1", divider: true },
      {
        id: "quit",
        label: "Quit",
        disabled: !win.isOpen,
        onSelect: () => closeWindow(key),
      },
    ];
  };

  return (
    <section id="dock">
      <div ref={dockRef} className="dock-container">
        {dockApps.map((app) => {
          const { id, name, icon, canOpen, separatorBefore } = app;

          return (
            <Fragment key={id}>
              {separatorBefore && (
                <>
                  <span className="dock-divider" aria-hidden="true" />

                  {minimized.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="dock-slot"
                      data-dock-slot={key}
                      aria-label={`${APP_MENUS[key].name}, minimized`}
                      onClick={() => openWindow(key)}
                    />
                  ))}
                </>
              )}
              <div className="relative flex justify-center">
                <button
                  type="button"
                  className="dock-icon app-icon-art"
                  // The icon's own URL, which masks the Tinted overlay to it
                  style={
                    { "--icon": `url(/images/${icon})` } as CSSProperties
                  }
                  aria-label={name}
                  data-tooltip-id="dock-tooltip"
                  data-tooltip-content={name}
                  data-tooltip-delay-show={150}
                  disabled={!canOpen}
                  onClick={() => toggleApp({ id, canOpen })}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const { top, left, width } =
                      e.currentTarget.getBoundingClientRect();
                    // Anchored to the icon, not the pointer — the dock's menu
                    // rises from the icon it belongs to
                    setMenu({ app, x: left + width / 2, y: top - 8 });
                  }}
                >
                  <img src={`/images/${icon}`} alt={name} loading="lazy" />
                </button>
                {isWindowKey(id) && windows[id].isOpen && (
                  <span className="running-dot" />
                )}
              </div>
            </Fragment>
          );
        })}
        <Tooltip id="dock-tooltip" place="top" className="tooltip" />
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.app)}
          onClose={closeMenu}
          placement="above"
          align="center"
        />
      )}
    </section>
  );
};

export default Dock;
