import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wallpapers } from "#constants/index";
import type { Appearance, Theme, Wallpaper } from "#types";

const DEFAULT_WALLPAPER = wallpapers[0];

const prefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

/** "auto" is a preference, not a theme — this is what it currently means. */
const resolveTheme = (appearance: Appearance): Theme =>
  appearance === "auto" ? (prefersDark() ? "dark" : "light") : appearance;

interface SystemStore {
  wallpaper: Wallpaper;
  /** What the visitor chose. */
  appearance: Appearance;
  /** What that choice currently resolves to — what the UI actually renders. */
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
  setAppearance: (appearance: Appearance) => void;
  toggleTheme: () => void;
  /** Re-resolves "auto" after the OS flips between light and dark. */
  syncSystemTheme: () => void;
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
  "wallpaper" | "appearance" | "theme" | "wifiEnabled" | "brightness" | "volume"
>;

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,
      appearance: "light",
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

      setAppearance: (appearance) =>
        set({ appearance, theme: resolveTheme(appearance) }),

      // Flipping the theme by hand is an explicit choice, so it drops "auto"
      toggleTheme: () =>
        set((state) => {
          const theme = state.theme === "light" ? "dark" : "light";
          return { appearance: theme, theme };
        }),

      syncSystemTheme: () =>
        set((state) =>
          state.appearance === "auto" ? { theme: resolveTheme("auto") } : {}
        ),

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
      version: 2,
      // Preferences survive reloads; transient UI state (popovers) does not.
      // The resolved theme is stored alongside the preference so a reload
      // paints the right one before matchMedia is consulted.
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        appearance: state.appearance,
        theme: state.theme,
        wifiEnabled: state.wifiEnabled,
        brightness: state.brightness,
        volume: state.volume,
      }),
      migrate: (persisted, version) => {
        let state = persisted as PersistedSystem;
        if (!state) return state;

        /**
         * v0 stored the built-in wallpaper's file path, which changed when the
         * assets moved to WebP. Re-resolve built-ins by id so an old visit
         * doesn't restore a 404; uploads (data URLs) are kept as-is.
         */
        if (version < 1 && state.wallpaper && state.wallpaper.id !== "custom") {
          const current = wallpapers.find((wp) => wp.id === state.wallpaper.id);
          state = { ...state, wallpaper: current ?? DEFAULT_WALLPAPER };
        }

        // v1 had no "auto": whichever theme was stored was the visitor's pick
        if (version < 2) {
          state = { ...state, appearance: state.theme ?? "light" };
        }

        return state;
      },
    }
  )
);

export default useSystemStore;
