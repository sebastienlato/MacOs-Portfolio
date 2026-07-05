import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wallpapers } from "#constants/index";
import type { Wallpaper } from "#types";

const DEFAULT_WALLPAPER = wallpapers[0];

interface SystemStore {
  wallpaper: Wallpaper;
  spotlightOpen: boolean;
  setWallpaper: (wallpaper: Wallpaper) => void;
  setCustomWallpaper: (dataUrl: string) => void;
  resetWallpaper: () => void;
  setSpotlightOpen: (open: boolean) => void;
  toggleSpotlight: () => void;
}

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,
      spotlightOpen: false,

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

      setSpotlightOpen: (open) => set({ spotlightOpen: open }),

      toggleSpotlight: () =>
        set((state) => ({ spotlightOpen: !state.spotlightOpen })),
    }),
    {
      name: "portfolio-system",
      // Only the wallpaper survives reloads; UI state like Spotlight does not
      partialize: (state) => ({ wallpaper: state.wallpaper }),
    }
  )
);

export default useSystemStore;
