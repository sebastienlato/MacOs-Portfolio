import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { APP_MENUS, DEFAULT_APP_MENU, type MenuItemDef } from "#constants/menus";
import useWindowStore from "#store/window";
import { runMenuAction } from "#utils/menuActions";

/**
 * The menus for whatever window is frontmost. macOS swaps the entire bar when
 * focus changes, which is the loudest cue that this is a desktop and not a page.
 */
const AppMenus = () => {
  const activeWindow = useWindowStore((state) => state.activeWindow);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuOwner, setMenuOwner] = useState(activeWindow);
  const rootRef = useRef<HTMLUListElement>(null);

  const app = activeWindow ? APP_MENUS[activeWindow] : DEFAULT_APP_MENU;

  // Focusing a different window swaps the whole bar, so any menu still hanging
  // open belongs to an app that is no longer frontmost. Adjusted during render
  // rather than in an effect, so the stale menu never paints.
  if (menuOwner !== activeWindow) {
    setMenuOwner(activeWindow);
    setOpenMenu(null);
  }

  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const handleItem = (item: MenuItemDef) => {
    if (item.disabled || !item.action) return;
    setOpenMenu(null);
    runMenuAction(item.action);
  };

  return (
    <ul id="app-menus" ref={rootRef}>
      {app.menus.map((menu, index) => (
        <li key={menu.title} className="menu">
          <button
            type="button"
            className={clsx(
              // The app menu carries the app's own name, always in bold
              index === 0 && "app-name",
              openMenu === menu.title && "open"
            )}
            aria-haspopup="menu"
            aria-expanded={openMenu === menu.title}
            onClick={() =>
              setOpenMenu((current) =>
                current === menu.title ? null : menu.title
              )
            }
            // Once one menu is open, sliding across the bar switches between
            // them without another click — the way a real menu bar tracks
            onMouseEnter={() => openMenu && setOpenMenu(menu.title)}
          >
            {menu.title}
          </button>

          {openMenu === menu.title && (
            <ul className="dropdown" role="menu">
              {menu.items.map((item) =>
                item.divider ? (
                  <li key={item.id} className="divider" role="separator" />
                ) : (
                  <li
                    key={item.id}
                    role="menuitem"
                    aria-disabled={item.disabled || !item.action}
                    className={clsx(
                      (item.disabled || !item.action) && "disabled"
                    )}
                    onClick={() => handleItem(item)}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="shortcut">{item.shortcut}</span>
                    )}
                  </li>
                )
              )}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

export default AppMenus;
