import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export interface ContextMenuItem {
  id: string;
  divider?: boolean;
  label?: string;
  disabled?: boolean;
  onSelect?: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  /** "above" hangs the menu off the top of (x, y) — what the dock needs. */
  placement?: "below" | "above";
  /** "center" treats x as the menu's horizontal midpoint. */
  align?: "start" | "center";
}

const EDGE_MARGIN = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * The one menu behind every right-click in the OS: the desktop's and the
 * dock's. It portals to the body because the dock is inside a transformed
 * ancestor, which would otherwise anchor a fixed child to the dock instead of
 * the viewport, and because a menu must never be clipped by what spawned it.
 */
const ContextMenu = ({
  x,
  y,
  items,
  onClose,
  placement = "below",
  align = "start",
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  // Measured rather than guessed: the item count decides the height, and a
  // hardcoded estimate pushes short menus away from the pointer for nothing.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const { width, height } = menu.getBoundingClientRect();
    const left = align === "center" ? x - width / 2 : x;
    const top = placement === "above" ? y - height : y;

    setPosition({
      left: clamp(left, EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN),
      top: clamp(top, EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN),
    });
  }, [x, y, items.length, placement, align]);

  // Mounting happens after the event that opened the menu has finished
  // dispatching, so these listeners can't immediately close it again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    // Closing on the item's own pointerdown would unmount the menu before its
    // click ever landed, so presses inside the menu are left to the item.
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("blur", onClose);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const select = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    onClose();
  };

  return createPortal(
    <ul
      ref={menuRef}
      className="context-menu"
      role="menu"
      style={{
        left: position?.left ?? x,
        top: position?.top ?? y,
        // Hidden for the single frame between render and measurement
        visibility: position ? "visible" : "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) =>
        item.divider ? (
          <li key={item.id} className="divider" role="separator" />
        ) : (
          <li
            key={item.id}
            role="menuitem"
            aria-disabled={item.disabled}
            className={clsx(item.disabled && "disabled")}
            onClick={() => select(item)}
          >
            {item.label}
          </li>
        )
      )}
    </ul>,
    document.body
  );
};

export default ContextMenu;
