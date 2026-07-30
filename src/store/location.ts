import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { locations } from "#constants/index";
import type { FinderItem } from "#types";

const DEFAULT_LOCATION = locations.work;

interface LocationStore {
  activeLocation: FinderItem;
  /**
   * Trash is the one location whose contents can change, so it lives here
   * rather than being read straight off the constant like every other folder.
   */
  trashItems: FinderItem[];
  setActiveLocation: (location: FinderItem | undefined) => void;
  emptyTrash: () => void;
}

const useLocationStore = create<LocationStore>()(
  immer((set) => ({
    activeLocation: DEFAULT_LOCATION,
    trashItems: locations.trash.children ?? [],

    setActiveLocation: (location) =>
      set((state) => {
        if (location === undefined) return;
        state.activeLocation = location;
      }),

    emptyTrash: () =>
      set((state) => {
        state.trashItems = [];
      }),
  }))
);

export default useLocationStore;
