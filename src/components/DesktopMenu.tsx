import { useEffect, useState } from "react";

import useSystemStore from "#store/system";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import { locations } from "#constants/index";

interface MenuItem {
  id: string;
  divider?: boolean;
  label?: string;
  onClick?: () => void;
}

interface MenuState {
  x: number;
  y: number;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 260;

/** Right-clicks inside these should keep the native menu / be ignored. */
const IGNORE_SELECTOR = "nav, #dock, #spotlight, #control-center";
const WINDOW_SELECTOR =
  "#finder, #safari, #resume, #terminal, #contact, #photos, #settings, #about, #txtfile, #imgfile";

const DesktopMenu = () => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const { openWindow } = useWindowStore();
  const { setActiveLocation } = useLocationStore();
  const { theme, toggleTheme } = useSystemStore();

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only hijack right-clicks on the desktop itself, not windows/chrome
      if (target.closest(IGNORE_SELECTOR) || target.closest(WINDOW_SELECTOR)) {
        return;
      }
      e.preventDefault();
      setMenu({
        x: Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8),
        y: Math.min(e.clientY, window.innerHeight - MENU_HEIGHT - 8),
      });
    };

    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("click", close);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("click", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!menu) return null;

  const run = (fn: () => void) => () => {
    fn();
    setMenu(null);
  };

  const items: MenuItem[] = [
    {
      id: "finder",
      label: "New Finder Window",
      onClick: run(() => {
        setActiveLocation(locations.work);
        openWindow("finder");
      }),
    },
    {
      id: "terminal",
      label: "Open Terminal",
      onClick: run(() => openWindow("terminal")),
    },
    { id: "d1", divider: true },
    {
      id: "wallpaper",
      label: "Change Wallpaper…",
      onClick: run(() => openWindow("settings")),
    },
    {
      id: "theme",
      label: theme === "dark" ? "Enter Light Mode" : "Enter Dark Mode",
      onClick: run(toggleTheme),
    },
    { id: "d2", divider: true },
    {
      id: "about",
      label: "About This Mac",
      onClick: run(() => openWindow("about")),
    },
  ];

  return (
    <ul
      id="desktop-menu"
      style={{ top: menu.y, left: menu.x }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) =>
        item.divider ? (
          <li key={item.id} className="divider" role="separator" />
        ) : (
          <li key={item.id} role="menuitem" onClick={item.onClick}>
            {item.label}
          </li>
        )
      )}
    </ul>
  );
};

export default DesktopMenu;
