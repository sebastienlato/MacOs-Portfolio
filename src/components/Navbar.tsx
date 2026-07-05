import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { navIcons, navLinks } from "#constants/index";
import useWindowStore from "#store/window";
import useSystemStore from "#store/system";
import type { WindowKey } from "#types";

type AppleMenuItem =
  | { id: string; divider: true }
  | { id: string; divider?: false; label: string; action: WindowKey | "restart" };

const appleMenuItems: AppleMenuItem[] = [
  { id: "about", label: "About This Mac", action: "about" },
  { id: "settings", label: "System Settings…", action: "settings" },
  { id: "wallpaper", label: "Change Wallpaper…", action: "settings" },
  { id: "divider-1", divider: true },
  { id: "restart", label: "Restart…", action: "restart" },
];

const Navbar = () => {
  const { openWindow } = useWindowStore();
  const { toggleSpotlight } = useSystemStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(dayjs());
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep the menu bar clock ticking like a real one
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 10_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleMenuItem = (action: WindowKey | "restart") => {
    setMenuOpen(false);
    if (action === "restart") {
      window.location.reload();
      return;
    }
    openWindow(action);
  };

  return (
    <nav>
      <div>
        <div className="apple-menu" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <img src="/images/logo.svg" alt="logo" />
          </button>

          {menuOpen && (
            <ul className="dropdown" role="menu">
              {appleMenuItems.map((item) =>
                item.divider ? (
                  <li key={item.id} className="divider" role="separator" />
                ) : (
                  <li
                    key={item.id}
                    role="menuitem"
                    onClick={() => handleMenuItem(item.action)}
                  >
                    {item.label}
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <p className="font-bold">Sebastien's Portfolio</p>

        <ul>
          {navLinks.map(({ id, name, type }) => (
            <li key={id} onClick={() => openWindow(type)}>
              <p>{name}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <ul>
          {navIcons.map(({ id, img, action }) => (
            <li
              key={id}
              onClick={action === "spotlight" ? toggleSpotlight : undefined}
            >
              <img src={img} className="icon-hover" alt={`icon-${id}`} />
            </li>
          ))}
        </ul>

        <time>{now.format("ddd MMM D h:mm A")}</time>
      </div>
    </nav>
  );
};
export default Navbar;
