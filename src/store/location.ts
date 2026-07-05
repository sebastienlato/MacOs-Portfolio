import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { locations } from "#constants/index";
import type { FinderItem } from "#types";

const DEFAULT_LOCATION = locations.work;

interface LocationStore {
  activeLocation: FinderItem;
  setActiveLocation: (location: FinderItem | undefined) => void;
}

const useLocationStore = create<LocationStore>()(
  immer((set) => ({
    activeLocation: DEFAULT_LOCATION,

    setActiveLocation: (location) =>
      set((state) => {
        if (location === undefined) return;
        state.activeLocation = location;
      }),
  }))
);

export default useLocationStore;
