import { create } from "zustand";

import type { MobileAppId } from "#mobile/constants";
import type { FinderItem } from "#types";

/** The tapped icon's box, so the app can zoom out of it the way iOS does. */
export interface OpenOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OpenOptions {
  origin?: OpenOrigin;
  /** Files only: the folders to start drilled into. */
  path?: FinderItem[];
}

/**
 * Whether an app owes the history stack an entry.
 *
 * Opening an app pushes one so the phone's Back gesture leaves the app instead
 * of leaving the site, which is the single thing a visitor will try first. It
 * lives outside the store because it is not state anything renders from — and
 * because both ways out (Back, and the home bar) have to agree on it.
 */
let pushedHistoryEntry = false;

interface MobileStore {
  activeApp: MobileAppId | null;
  /**
   * Bumped on every open, and used as the app's React key. Without it, opening
   * the app that is already open reconciles instead of remounting, and the app
   * keeps the navigation stack it seeded from the *previous* `path`.
   */
  launch: number;
  origin: OpenOrigin | null;
  path: FinderItem[] | null;
  /**
   * Set while the app plays its dismiss animation. The app stays mounted for
   * that stretch — unmounting on the tap would take the thing being animated
   * away with it.
   */
  closing: boolean;
  openApp: (id: MobileAppId, options?: OpenOptions) => void;
  /** Leaving an app: the home bar, a swipe up, the terminal's `exit`. */
  dismiss: () => void;
  /** Only for MobileShell's popstate listener. */
  handleBack: () => void;
  finishClose: () => void;
}

const useMobileStore = create<MobileStore>()((set) => ({
  activeApp: null,
  launch: 0,
  origin: null,
  path: null,
  closing: false,

  openApp: (id, options) => {
    // One entry covers the whole visit to the apps, so hopping straight from
    // one app to another (the terminal's `open`) doesn't stack up presses
    if (!pushedHistoryEntry) {
      window.history.pushState({ portfolioApp: true }, "");
      pushedHistoryEntry = true;
    }

    set((state) => ({
      activeApp: id,
      launch: state.launch + 1,
      origin: options?.origin ?? null,
      path: options?.path ?? null,
      closing: false,
    }));
  },

  dismiss: () => {
    // Going back *is* the dismissal, so the Back gesture and the home bar run
    // the same path rather than leaving a dead entry behind for each app closed
    if (pushedHistoryEntry) {
      window.history.back();
      return;
    }

    set({ closing: true });
  },

  handleBack: () => {
    pushedHistoryEntry = false;
    set((state) => (state.activeApp ? { closing: true } : {}));
  },

  finishClose: () =>
    set({ activeApp: null, origin: null, path: null, closing: false }),
}));

export default useMobileStore;
