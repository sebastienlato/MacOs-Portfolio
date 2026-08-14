import { create } from "zustand";
import { persist } from "zustand/middleware";
import { accents, wallpapers } from "#constants/index";
import type { Accent, Appearance, IconStyle, Theme, Wallpaper } from "#types";

/*
 * Resolved by id rather than taken from the head of the list. The list is
 * ordered newest-first, so its first entry moves every time a release is added
 * — and what a visitor lands on, and what Reset goes back to, should not change
 * as a side effect of that ordering. Sequoia is also the only photograph in the
 * set, which is the better first impression than any of the gradients.
 */
const DEFAULT_WALLPAPER =
  wallpapers.find((wallpaper) => wallpaper.id === "sequoia") ?? wallpapers[0];
const DEFAULT_ACCENT = accents[0];

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
  /** The colour every selection, highlight and focus ring is drawn from. */
  accent: Accent;
  /** How app icons are recoloured — macOS 26's Default/Dark/Clear/Tinted. */
  iconStyle: IconStyle;
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
  setAccent: (accent: Accent) => void;
  setIconStyle: (iconStyle: IconStyle) => void;
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
  | "wallpaper"
  | "appearance"
  | "theme"
  | "accent"
  | "iconStyle"
  | "wifiEnabled"
  | "brightness"
  | "volume"
>;

const useSystemStore = create<SystemStore>()(
  persist(
    (set) => ({
      wallpaper: DEFAULT_WALLPAPER,
      appearance: "light",
      theme: "light",
      accent: DEFAULT_ACCENT,
      iconStyle: "default",
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

      setAccent: (accent) => set({ accent }),

      setIconStyle: (iconStyle) => set({ iconStyle }),

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
        accent: state.accent,
        iconStyle: state.iconStyle,
        wifiEnabled: state.wifiEnabled,
        brightness: state.brightness,
        volume: state.volume,
      }),
      /**
       * Both the accent and the wallpaper are stored as whole objects, so an
       * old visit would keep a stale copy of one that has since been adjusted
       * — a gradient retuned, an image moved to a new path. Re-resolving them
       * by id on every rehydrate is what keeps `constants` the truth.
       *
       * Doing it here rather than in a migration is the point. A migration
       * fires once, on the version it names, so a visitor already on the
       * current version would hold their stale copy for ever: the wallpaper
       * used to be handled that way, and a retuned gradient never reached
       * anyone who had it selected.
       *
       * Uploads are the exception and pass straight through. A custom
       * wallpaper's data URL exists only in the persisted state, so there is
       * nothing in `constants` to resolve it against, and looking it up by id
       * would throw the visitor's own picture away.
       */
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as PersistedSystem) };
        return {
          ...state,
          accent:
            accents.find((accent) => accent.id === state.accent?.id) ??
            DEFAULT_ACCENT,
          wallpaper:
            state.wallpaper?.id === "custom"
              ? state.wallpaper
              : (wallpapers.find(
                  (wallpaper) => wallpaper.id === state.wallpaper?.id
                ) ?? DEFAULT_WALLPAPER),
        };
      },
      migrate: (persisted, version) => {
        let state = persisted as PersistedSystem;
        if (!state) return state;

        /*
         * v0's wallpaper fix-up lived here — it stored the built-in's file
         * path, which changed when the assets moved to WebP. `merge` now
         * re-resolves every built-in by id on every rehydrate, which covers
         * that case and the ones a once-only migration could not, so there is
         * nothing version-specific left to do for it.
         */

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
