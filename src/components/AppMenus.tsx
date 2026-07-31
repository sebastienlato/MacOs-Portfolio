import {
  useEffect,
  useRef,
  useState,
  // Aliased: the bare name would shadow the DOM KeyboardEvent that the
  // document-level Escape listener below is typed against
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
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
    // Escape still closes a menu opened by mouse, where focus never entered it
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
    focusTitle(openMenu);
    runMenuAction(item.action);
  };

  /** The bar's own buttons, in the order they are drawn. */
  const titles = () => [
    ...(rootRef.current?.querySelectorAll<HTMLButtonElement>(
      ":scope > .menu > button"
    ) ?? []),
  ];

  const focusTitle = (title: string | null) => {
    const index = app.menus.findIndex((menu) => menu.title === title);
    titles()[index]?.focus();
  };

  /** Items you can actually pick — the greyed-out ones are skipped over. */
  const enabledItems = () => [
    ...(rootRef.current?.querySelectorAll<HTMLLIElement>(
      '.dropdown > li[role="menuitem"]:not(.disabled)'
    ) ?? []),
  ];

  /** Wraps, the way a real menu does when you hold the arrow down. */
  const focusItemAt = (index: number) => {
    const items = enabledItems();
    if (items.length === 0) return;
    items[((index % items.length) + items.length) % items.length]?.focus();
  };

  const moveFocus = (from: HTMLElement, delta: number) =>
    focusItemAt(enabledItems().indexOf(from as HTMLLIElement) + delta);

  /**
   * ←/→ walk the bar whether or not a menu is open, as macOS does — and if one
   * was open, the next one opens with it, focus staying on the title.
   */
  const stepAlongBar = (title: string, direction: 1 | -1) => {
    const index = app.menus.findIndex((menu) => menu.title === title);
    const next =
      app.menus[(index + direction + app.menus.length) % app.menus.length];

    if (openMenu) setOpenMenu(next.title);
    focusTitle(next.title);
  };

  const onTitleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, title: string) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpenMenu(title);
      // The list does not exist until the menu opens, so the first item can
      // only be reached once React has painted it
      requestAnimationFrame(() => focusItemAt(e.key === "ArrowDown" ? 0 : -1));
      return;
    }

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      stepAlongBar(title, e.key === "ArrowRight" ? 1 : -1);
    }
  };

  const onItemKeyDown = (e: ReactKeyboardEvent<HTMLLIElement>, item: MenuItemDef) => {
    const { key, currentTarget } = e;

    if (key === "ArrowDown" || key === "ArrowUp") {
      e.preventDefault();
      moveFocus(currentTarget, key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (key === "Enter" || key === " ") {
      e.preventDefault();
      handleItem(item);
      return;
    }

    if (key === "Escape" || key === "Tab") {
      // Escape closes and hands focus back to the title, so the bar is still
      // where you left it. Tab closes too, then goes wherever it was going.
      if (key === "Escape") e.preventDefault();
      const title = openMenu;
      setOpenMenu(null);
      if (key === "Escape") focusTitle(title);
      return;
    }

    if (key === "ArrowRight" || key === "ArrowLeft") {
      e.preventDefault();
      if (openMenu) stepAlongBar(openMenu, key === "ArrowRight" ? 1 : -1);
    }
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
            onKeyDown={(e) => onTitleKeyDown(e, menu.title)}
            // Once one menu is open, sliding across the bar switches between
            // them without another click — the way a real menu bar tracks
            onMouseEnter={() => openMenu && setOpenMenu(menu.title)}
          >
            {menu.title}
          </button>

          {openMenu === menu.title && (
            <ul className="dropdown" role="menu" aria-label={menu.title}>
              {menu.items.map((item) =>
                item.divider ? (
                  <li key={item.id} className="divider" role="separator" />
                ) : (
                  <li
                    key={item.id}
                    role="menuitem"
                    aria-disabled={item.disabled || !item.action}
                    /* Roving focus: the menu owns the tab stop, and the arrow
                       keys move a real focus between its items */
                    tabIndex={item.disabled || !item.action ? undefined : -1}
                    className={clsx(
                      (item.disabled || !item.action) && "disabled"
                    )}
                    onClick={() => handleItem(item)}
                    onKeyDown={(e) => onItemKeyDown(e, item)}
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
