import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wallpapers } from "#constants/index";
import type { Wallpaper } from "#types";

const DEFAULT_WALLPAPER = wallpapers[0];

interface SystemStore {
  wallpaper: Wallpaper;
  setWallpaper: (wallpaper: Wallpaper) => void;
  setCustomWallpaper: (dataUrl: string) => void;
  resetWallpaper: () => void;
}

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,

      setWallpaper: (wallpaper) => set({ wallpaper }),

      setCustomWallpaper: (dataUrl) =>
        set({
          wallpaper: {
            id: "custom",
            name: "Custom",
            type: "image",
            value: dataUrl,
          },
        }),

      resetWallpaper: () => set({ wallpaper: DEFAULT_WALLPAPER }),
    }),
    { name: "portfolio-system" }
  )
);

export default useSystemStore;
