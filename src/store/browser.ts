import { create } from "zustand";

/**
 * The Safari window's one tab: where it has been, and where it is.
 *
 * A store rather than state inside the window so the menu bar can drive it —
 * History ▸ Back and View ▸ Reload resolve through `runMenuAction`, which has
 * no component to reach into.
 *
 * `null` is the Start Page. History only records the navigations made from
 * here — the toolbar, the Start Page, the menus. Links followed *inside* a
 * page belong to another origin, which is exactly what the frame is not
 * allowed to see.
 */
interface BrowserStore {
  history: (string | null)[];
  index: number;
  /** Bumped to remount the frame, which is the only reload a parent can do. */
  reloadKey: number;
  navigate: (url: string | null) => void;
  back: () => void;
  forward: () => void;
  reload: () => void;
}

const useBrowserStore = create<BrowserStore>()((set) => ({
  history: [null],
  index: 0,
  reloadKey: 0,

  navigate: (url) =>
    set((state) => {
      // Going somewhere new from the middle of history drops what was ahead
      const history = [...state.history.slice(0, state.index + 1), url];
      return { history, index: history.length - 1 };
    }),

  back: () => set((state) => ({ index: Math.max(0, state.index - 1) })),

  forward: () =>
    set((state) => ({
      index: Math.min(state.history.length - 1, state.index + 1),
    })),

  reload: () => set((state) => ({ reloadKey: state.reloadKey + 1 })),
}));

export const currentUrl = (state: BrowserStore) => state.history[state.index];

export default useBrowserStore;
