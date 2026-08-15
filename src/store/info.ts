import { create } from "zustand";
import type { FinderItem } from "#types";

/**
 * Which folder Get Info is open on, or null when it is closed.
 *
 * A store for the same reason Quick Look has one: the panel floats over the
 * desktop and cannot live inside the Finder window that opens it, which is
 * `overflow-hidden` and carries a size the visitor can drag around.
 */
interface InfoStore {
  item: FinderItem | null;
  open: (item: FinderItem) => void;
  close: () => void;
}

const useInfoStore = create<InfoStore>()((set) => ({
  item: null,
  open: (item) => set({ item }),
  close: () => set({ item: null }),
}));

export default useInfoStore;
