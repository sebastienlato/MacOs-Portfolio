import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { Wifi, WifiOff } from "lucide-react";
import { navIcons } from "#constants/index";
import useWindowStore from "#store/window";
import useSystemStore from "#store/system";
import ControlCenter from "#components/ControlCenter";
import AppMenus from "#components/AppMenus";
import useMenuKeyboard from "#hooks/useMenuKeyboard";
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

const navIconActions = {
  spotlight: "toggleSpotlight",
} as const;

/**
 * What a screen reader should call each icon that actually does something.
 *
 * Keyed by the same action, so an icon added to `navIcons` without a name here
 * is a type error rather than a button announced as "button".
 */
const navIconLabels = {
  spotlight: "Spotlight Search",
} as const;

const Navbar = () => {
  const { openWindow } = useWindowStore();
  const {
    toggleSpotlight,
    spotlightOpen,
    wifiEnabled,
    toggleNotificationCenter,
    notificationCenterOpen,
  } = useSystemStore();
  const iconHandlers = { toggleSpotlight };
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(dayjs());
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const closeAppleMenu = useCallback(() => {
    setMenuOpen(false);
    // Hand focus back to the logo, so the bar is where you left it
    menuRef.current?.querySelector("button")?.focus();
  }, []);

  useMenuKeyboard(dropdownRef, { onClose: closeAppleMenu, autoFocus: menuOpen });

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
            /* Named here rather than by the glyph's alt text, which had this
               announced as "logo" — the name of the picture, not of the menu
               it opens */
            aria-label="Apple"
          >
            <img src="/images/logo.svg" alt="" className="invert" />
          </button>

          {menuOpen && (
            <ul className="dropdown" role="menu" ref={dropdownRef} aria-label="Apple">
              {appleMenuItems.map((item) =>
                item.divider ? (
                  <li key={item.id} className="divider" role="separator" />
                ) : (
                  <li
                    key={item.id}
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => handleMenuItem(item.action)}
                  >
                    {item.label}
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <AppMenus />
      </div>

      <div>
        <ul>
          {navIcons.map(({ id, img, action }) => {
            /* A status, not a control — there is nothing here to press. The
               glyph is the whole message, so it is labelled with the state it
               is reporting rather than with the word "status". */
            if (action === "wifi") {
              return (
                <li
                  key={id}
                  className="wifi-status"
                  role="img"
                  aria-label={wifiEnabled ? "Wi-Fi on" : "Wi-Fi off"}
                >
                  {wifiEnabled ? <Wifi size={17} /> : <WifiOff size={17} />}
                </li>
              );
            }

            /*
             * Anything that does something is a button. These were <li>s
             * carrying an onClick, which a pointer can use and a keyboard
             * cannot: Spotlight — the only one of them — could not be reached
             * without a mouse at all.
             *
             * `action` is narrowed to "spotlight" here, which is what lets the
             * expanded state below be that panel's without a second lookup.
             */
            if (action) {
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={iconHandlers[navIconActions[action]]}
                    aria-label={navIconLabels[action]}
                    aria-haspopup="dialog"
                    aria-expanded={spotlightOpen}
                  >
                    <img src={img} className="icon-hover invert" alt="" />
                  </button>
                </li>
              );
            }

            /* Ornament, and announced as "icon-3" until now. An empty alt is
               what keeps an image with nothing to say out of the way. */
            return (
              <li key={id} aria-hidden="true">
                <img src={img} className="icon-hover invert" alt="" />
              </li>
            );
          })}
        </ul>

        <ControlCenter />

        {/*
          The clock is the Notification Center's handle, as in macOS.

          A real button rather than a <time> wearing role="button" and a
          tabindex. That combination took focus and then did nothing with it:
          Enter and Space only activate an element the browser knows to be a
          button, so the panel was reachable by keyboard and impossible to
          open — worse than not being reachable at all. The <time> stays on the
          inside, where it can carry the machine-readable date it is for.
        */}
        <button
          type="button"
          className="clock"
          onClick={toggleNotificationCenter}
          aria-haspopup="dialog"
          aria-expanded={notificationCenterOpen}
        >
          <time dateTime={now.toISOString()}>
            {now.format("ddd MMM D h:mm A")}
          </time>
        </button>
      </div>
    </nav>
  );
};
export default Navbar;
