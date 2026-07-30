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
  notificationCenterOpen: boolean;
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
  setNotificationCenterOpen: (open: boolean) => void;
  toggleNotificationCenter: () => void;
  toggleWifi: () => void;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
}

/** The slice of the store that is written to localStorage. */
type PersistedSystem = Pick<
  SystemStore,
  "wallpaper" | "theme" | "wifiEnabled" | "brightness" | "volume"
>;

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,
      theme: "light",
      spotlightOpen: false,
      controlCenterOpen: false,
      notificationCenterOpen: false,
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

      setNotificationCenterOpen: (open) =>
        set({ notificationCenterOpen: open }),

      // The two panels are mutually exclusive, as they are in the menu bar
      toggleNotificationCenter: () =>
        set((state) => ({
          notificationCenterOpen: !state.notificationCenterOpen,
          controlCenterOpen: false,
        })),

      toggleWifi: () => set((state) => ({ wifiEnabled: !state.wifiEnabled })),

      setBrightness: (value) => set({ brightness: value }),

      setVolume: (value) => set({ volume: value }),
    }),
    {
      name: "portfolio-system",
      version: 1,
      // Preferences survive reloads; transient UI state (popovers) does not
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        theme: state.theme,
        wifiEnabled: state.wifiEnabled,
        brightness: state.brightness,
        volume: state.volume,
      }),
      /**
       * v0 stored the built-in wallpaper's file path, which changed when the
       * assets moved to WebP. Re-resolve built-ins by id so an old visit
       * doesn't restore a 404; uploads (data URLs) are kept as-is.
       */
      migrate: (persisted, version) => {
        const state = persisted as PersistedSystem;
        if (version >= 1 || !state?.wallpaper || state.wallpaper.id === "custom")
          return state;

        const current = wallpapers.find((wp) => wp.id === state.wallpaper.id);
        return { ...state, wallpaper: current ?? DEFAULT_WALLPAPER };
      },
    }
  )
);

export default useSystemStore;
