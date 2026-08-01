import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A desktop icon's offset from where the CSS put it, in pixels. */
export interface IconOffset {
  x: number;
  y: number;
}

interface DesktopStore {
  /** Keyed by `FinderItem.id`, and only holds icons that have been moved. */
  icons: Record<number, IconOffset>;
  moveIcon: (id: number, offset: IconOffset) => void;
  /** Sends every icon back to the arrangement `constants` describes. */
  resetIcons: () => void;
}

/**
 * Where the visitor put the desktop icons.
 *
 * localStorage rather than session, unlike the window store: an open window is
 * something you are doing and a tidied desktop is something you have. macOS
 * agrees — icon positions outlive a restart, and nobody expects the folder they
 * dragged aside to walk back overnight.
 *
 * Offsets rather than coordinates, so an icon that has never been moved is
 * simply absent and keeps whatever position `constants` gives it — including
 * when that arrangement is changed later.
 */
const useDesktopStore = create<DesktopStore>()(
  persist(
    (set) => ({
      icons: {},

      moveIcon: (id, offset) =>
        set((state) => ({ icons: { ...state.icons, [id]: offset } })),

      resetIcons: () => set({ icons: {} }),
    }),
    { name: "portfolio-desktop-icons" }
  )
);

export default useDesktopStore;
