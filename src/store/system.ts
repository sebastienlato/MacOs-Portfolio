import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wallpapers } from "#constants/index";
import type { Theme, Wallpaper } from "#types";

const DEFAULT_WALLPAPER = wallpapers[0];

interface SystemStore {
  wallpaper: Wallpaper;
  theme: Theme;
  spotlightOpen: boolean;
  controlCenterOpen: boolean;
  wifiEnabled: boolean;
  brightness: number;
  volume: number;
  setWallpaper: (wallpaper: Wallpaper) => void;
  setCustomWallpaper: (dataUrl: string) => void;
  resetWallpaper: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSpotlightOpen: (open: boolean) => void;
  toggleSpotlight: () => void;
  setControlCenterOpen: (open: boolean) => void;
  toggleControlCenter: () => void;
  toggleWifi: () => void;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
}

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,
      theme: "light",
      spotlightOpen: false,
      controlCenterOpen: false,
      wifiEnabled: true,
      brightness: 100,
      volume: 65,

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

      setControlCenterOpen: (open) => set({ controlCenterOpen: open }),

      toggleControlCenter: () =>
        set((state) => ({ controlCenterOpen: !state.controlCenterOpen })),

      toggleWifi: () => set((state) => ({ wifiEnabled: !state.wifiEnabled })),

      setBrightness: (value) => set({ brightness: value }),

      setVolume: (value) => set({ volume: value }),
    }),
    {
      name: "portfolio-system",
      // Preferences survive reloads; transient UI state (popovers) does not
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        theme: state.theme,
        wifiEnabled: state.wifiEnabled,
        brightness: state.brightness,
        volume: state.volume,
      }),
    }
  )
);

export default useSystemStore;
