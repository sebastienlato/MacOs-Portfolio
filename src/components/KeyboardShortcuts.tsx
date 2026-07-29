import { useEffect } from "react";

import type { MenuAction } from "#constants/menus";
import useSystemStore from "#store/system";
import { runMenuAction } from "#utils/menuActions";

interface Binding {
  /** Matched case-insensitively against KeyboardEvent.key. */
  key: string;
  shift?: boolean;
  action: MenuAction;
}

/**
 * Keys are paired with the same MenuAction the menu items use, so a shortcut
 * and the menu item printing it can never disagree.
 *
 * Caveat worth knowing: macOS browsers reserve several of these — ⌘W, ⌘N and
 * ⌘Q are handled by Safari and Chrome before the page ever sees them, and no
 * amount of preventDefault takes them back. They are bound anyway because the
 * browser's behaviour is identical whether we bind them or not, and in the
 * contexts that do hand them over (installed PWAs, some embedded browsers)
 * they work properly.
 */
const BINDINGS: Binding[] = [
  { key: "w", action: "close" },
  { key: "q", action: "close" },
  { key: "m", action: "minimize" },
  { key: ",", action: "settings" },
  { key: "n", action: "newFinder" },
  { key: "r", shift: true, action: "openResume" },
  { key: "g", shift: true, action: "openPhotos" },
  { key: "a", shift: true, action: "openSafari" },
];

const KeyboardShortcuts = () => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;

      if (e.key === "Escape") {
        // Escape dismisses what is floating on top. It deliberately does not
        // close windows — that is ⌘W, and macOS never bound Escape to it.
        const { spotlightOpen, setSpotlightOpen, controlCenterOpen, setControlCenterOpen } =
          useSystemStore.getState();
        if (spotlightOpen) setSpotlightOpen(false);
        else if (controlCenterOpen) setControlCenterOpen(false);
        return;
      }

      if (!cmd) return;

      if (e.key.toLowerCase() === "k" || e.code === "Space") {
        e.preventDefault();
        useSystemStore.getState().toggleSpotlight();
        return;
      }

      const match = BINDINGS.find(
        (b) =>
          b.key === e.key.toLowerCase() && Boolean(b.shift) === Boolean(e.shiftKey)
      );
      if (!match) return;

      e.preventDefault();
      runMenuAction(match.action);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
};

export default KeyboardShortcuts;
