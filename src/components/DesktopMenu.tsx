import { useCallback, useEffect, useState } from "react";

import useSystemStore from "#store/system";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import useDesktopStore from "#store/desktop";
import { locations, NON_DESKTOP_SELECTOR } from "#constants/index";
import ContextMenu, { type ContextMenuItem } from "#components/ContextMenu";

interface MenuState {
  x: number;
  y: number;
}

const DesktopMenu = () => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const { openWindow } = useWindowStore();
  const { setActiveLocation } = useLocationStore();
  const { theme, toggleTheme } = useSystemStore();
  const resetIcons = useDesktopStore((state) => state.resetIcons);
  const isTidy = useDesktopStore(
    (state) => Object.keys(state.icons).length === 0
  );

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only hijack right-clicks on the desktop itself, not windows/chrome
      if (target.closest(NON_DESKTOP_SELECTOR)) return;

      e.preventDefault();
      setMenu({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, []);

  if (!menu) return null;

  const items: ContextMenuItem[] = [
    {
      id: "finder",
      label: "New Finder Window",
      onSelect: () => {
        setActiveLocation(locations.work);
        openWindow("finder");
      },
    },
    {
      id: "terminal",
      label: "Open Terminal",
      onSelect: () => openWindow("terminal"),
    },
    // Only offered once there is something to tidy, rather than sitting there
    // as an item that visibly does nothing
    ...(isTidy
      ? []
      : [
          { id: "d0", divider: true },
          {
            id: "clean-up",
            label: "Clean Up",
            onSelect: resetIcons,
          },
        ]),
    { id: "d1", divider: true },
    {
      id: "wallpaper",
      label: "Change Wallpaper…",
      onSelect: () => openWindow("settings"),
    },
    {
      id: "theme",
      label: theme === "dark" ? "Enter Light Mode" : "Enter Dark Mode",
      onSelect: toggleTheme,
    },
    { id: "d2", divider: true },
    {
      id: "about",
      label: "About This Mac",
      onSelect: () => openWindow("about"),
    },
  ];

  return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={close} />;
};

export default DesktopMenu;
