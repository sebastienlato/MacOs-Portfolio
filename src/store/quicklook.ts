import { create } from "zustand";
import type { FinderItem } from "#types";

/**
 * What Quick Look is showing, or null when it is not showing anything.
 *
 * A store rather than state inside the Finder, because the panel cannot live
 * inside the window that summons it: a Finder window is `overflow-hidden` and
 * carries a resizable size, so a panel rendered in there would be clipped to it
 * and scaled with it. Quick Look floats over the whole desktop, so it is
 * mounted at the desktop's root and told what to show from here.
 */
interface QuickLookStore {
  item: FinderItem | null;
  open: (item: FinderItem) => void;
  close: () => void;
  /** Space over an item that is already being previewed puts it away again. */
  toggle: (item: FinderItem) => void;
}

const useQuickLookStore = create<QuickLookStore>()((set) => ({
  item: null,
  open: (item) => set({ item }),
  close: () => set({ item: null }),
  toggle: (item) =>
    set((state) => ({ item: state.item?.id === item.id ? null : item })),
}));

export default useQuickLookStore;
