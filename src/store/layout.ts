import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WindowKey } from "#types";

export interface WindowLayout {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

interface LayoutStore {
  layouts: Partial<Record<WindowKey, WindowLayout>>;
  saveLayout: (key: WindowKey, layout: Partial<WindowLayout>) => void;
}

const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      layouts: {},

      saveLayout: (key, layout) =>
        set((state) => ({
          layouts: {
            ...state.layouts,
            [key]: { x: 0, y: 0, ...state.layouts[key], ...layout },
          },
        })),
    }),
    { name: "portfolio-window-layouts" }
  )
);

export default useLayoutStore;
