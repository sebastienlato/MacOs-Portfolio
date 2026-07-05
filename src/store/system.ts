import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wallpapers } from "#constants/index";
import type { Theme, Wallpaper } from "#types";

const DEFAULT_WALLPAPER = wallpapers[0];

interface SystemStore {
  wallpaper: Wallpaper;
  theme: Theme;
  spotlightOpen: boolean;
  setWallpaper: (wallpaper: Wallpaper) => void;
  setCustomWallpaper: (dataUrl: string) => void;
  resetWallpaper: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSpotlightOpen: (open: boolean) => void;
  toggleSpotlight: () => void;
}

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,
      theme: "light",
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

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

      setSpotlightOpen: (open) => set({ spotlightOpen: open }),

      toggleSpotlight: () =>
        set((state) => ({ spotlightOpen: !state.spotlightOpen })),
    }),
    {
      name: "portfolio-system",
      // Wallpaper and theme survive reloads; UI state like Spotlight does not
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        theme: state.theme,
      }),
    }
  )
);

export default useSystemStore;
