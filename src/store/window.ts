import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { INITIAL_Z_INDEX, WINDOW_CONFIG } from "#constants/index";
import type { FinderItem, WindowKey, WindowState, WindowTile } from "#types";

/**
 * The frontmost window a visitor can actually interact with. Closing or
 * minimizing the active window hands focus to whatever is next down the stack,
 * the way macOS does, rather than leaving the menu bar pointing at nothing.
 */
const topMostWindow = (
  windows: Record<WindowKey, WindowState>
): WindowKey | null => {
  let top: WindowKey | null = null;
  let topZ = -Infinity;

  for (const [key, win] of Object.entries(windows) as [
    WindowKey,
    WindowState,
  ][]) {
    if (win.isOpen && !win.isMinimized && win.zIndex > topZ) {
      top = key;
      topZ = win.zIndex;
    }
  }

  return top;
};

interface WindowStore {
  windows: Record<WindowKey, WindowState>;
  nextZIndex: number;
  /** null when nothing is open — the menu bar falls back to Finder. */
  activeWindow: WindowKey | null;
  /** True while every open window is scaled down into the overview grid. */
  missionControl: boolean;
  toggleMissionControl: () => void;
  openWindow: (windowKey: WindowKey, data?: FinderItem | null) => void;
  closeWindow: (windowKey: WindowKey) => void;
  minimizeWindow: (windowKey: WindowKey) => void;
  /** Tiles to a region, or restores to free-floating with null. */
  tileWindow: (windowKey: WindowKey, tile: WindowTile | null) => void;
  /** The green button on its own: fill the screen, or come back from it. */
  toggleZoom: (windowKey: WindowKey) => void;
  focusWindow: (windowKey: WindowKey) => void;
}

const useWindowStore = create<WindowStore>()(
  immer((set) => ({
    windows: WINDOW_CONFIG,
    nextZIndex: INITIAL_Z_INDEX + 1,
    activeWindow: null,
    missionControl: false,

    toggleMissionControl: () =>
      set((state) => {
        state.missionControl = !state.missionControl;
      }),

    openWindow: (windowKey, data = null) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;
        win.isOpen = true;
        win.isMinimized = false;
        win.hasOpened = true;
        win.zIndex = state.nextZIndex;
        win.data = data ?? win.data;
        state.nextZIndex++;
        state.activeWindow = windowKey;
        state.missionControl = false;
      }),

    closeWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;
        win.isOpen = false;
        win.isMinimized = false;
        win.tile = null;
        win.zIndex = INITIAL_Z_INDEX;
        win.data = null;
        state.activeWindow = topMostWindow(state.windows);
      }),

    minimizeWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;
        win.isMinimized = true;
        state.activeWindow = topMostWindow(state.windows);
      }),

    tileWindow: (windowKey, tile) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;
        win.tile = tile;
        win.zIndex = state.nextZIndex++;
        state.activeWindow = windowKey;
      }),

    toggleZoom: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;
        // Zoom toggles against fill only: from a half-tile it fills rather
        // than restoring, which is what the green button does in macOS.
        win.tile = win.tile === "fill" ? null : "fill";
        win.zIndex = state.nextZIndex++;
        state.activeWindow = windowKey;
      }),

    focusWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;
        win.zIndex = state.nextZIndex++;
        state.activeWindow = windowKey;
        // Picking a window is the whole point of the overview, so leave it
        state.missionControl = false;
      }),
  }))
);

export default useWindowStore;
