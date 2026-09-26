import { useEffect, type RefObject } from "react";

/**
 * Arrow-key navigation for a menu: ↑/↓ move between items and wrap at the ends,
 * Home/End jump, Enter and Space pick, Escape closes. Disabled items are
 * stepped over rather than focused, the way macOS skips a greyed-out entry.
 *
 * Listens on the container rather than on each item, so a menu whose contents
 * change while it is open needs no re-binding.
 *
 * The menu bar has its own copy of this: on top of moving within a menu, ←/→
 * have to walk the bar and carry the open menu with them, which is a shape this
 * would have to grow a second job to describe.
 */

const ITEMS = '[role="menuitem"]:not(.disabled):not([aria-disabled="true"])';

interface Options {
  onClose?: () => void;
  /** Take focus as soon as the menu appears — right for a menu you opened. */
  autoFocus?: boolean;
  /**
   * What takes it. "first" is the first item, for a menu raised from the
   * keyboard. "menu" is the menu itself, for one raised by a click: macOS
   * shows nothing highlighted until you move, yet the arrows still have to
   * work from there, and they can only if focus is already inside.
   */
  focusTarget?: "first" | "menu";
}

const useMenuKeyboard = (
  ref: RefObject<HTMLElement | null>,
  { onClose, autoFocus = false, focusTarget = "first" }: Options = {}
) => {
  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;

    const items = () => [...menu.querySelectorAll<HTMLElement>(ITEMS)];

    const focusAt = (index: number) => {
      const all = items();
      if (all.length === 0) return;
      all[((index % all.length) + all.length) % all.length]?.focus();
    };

    if (autoFocus) {
      if (focusTarget === "menu") menu.focus();
      else focusAt(0);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const all = items();
      const current = all.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusAt(current + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          // From the menu itself (-1), up is the last item, not the one
          // before it
          focusAt(current < 0 ? -1 : current - 1);
          break;
        case "Home":
          e.preventDefault();
          focusAt(0);
          break;
        case "End":
          e.preventDefault();
          focusAt(-1);
          break;
        case "Enter":
        case " ":
          if (current < 0) return;
          e.preventDefault();
          // Let the item's own click handler decide what picking it means
          all[current].click();
          break;
        case "Escape":
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    menu.addEventListener("keydown", onKeyDown);
    return () => menu.removeEventListener("keydown", onKeyDown);
  }, [ref, onClose, autoFocus, focusTarget]);
};

export default useMenuKeyboard;
