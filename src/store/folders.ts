import { create } from "zustand";
import { persist } from "zustand/middleware";

import { slug } from "#utils/routes";
import type { FinderItem, FolderBadge, FolderColor } from "#types";

export interface FolderLook {
  color?: FolderColor;
  /**
   * `"none"` is not the same as absent. Absent means the visitor has not
   * touched the badge and the authored one still applies; `"none"` means they
   * took it off and expect it gone. Without the distinction, removing a badge
   * fell straight back to the one shipped in `constants` and looked like the
   * click had done nothing — going back to the default is what Reset is for.
   */
  badge?: FolderBadge | "none";
}

/** The badge to actually draw, once the override has had its say. */
export const badgeOf = (
  look: FolderLook | undefined,
  authored: FolderBadge | undefined
): FolderBadge | undefined =>
  look?.badge === "none" ? undefined : (look?.badge ?? authored);

interface FolderStore {
  /** Keyed by folder slug — see `keyOf`. */
  looks: Record<string, FolderLook>;
  setLook: (item: FinderItem, look: FolderLook) => void;
  resetLook: (item: FinderItem) => void;
}

/**
 * How a folder is identified once the visitor has customised it.
 *
 * By slug rather than by `id`, because `id` is only unique among siblings: the
 * three projects are 5, 6 and 7, and the files inside every one of them are 1,
 * 2 and 4 again. Keying on that would have a change to one project's folder
 * turn up on another's. The slug is what `routes` already treats as an item's
 * identity, so a folder keeps its look across a reload for the same reason its
 * URL keeps working.
 */
export const keyOf = (item: FinderItem) => slug(item.name);

/**
 * What the visitor has done to their folders, as macOS 26's Get Info allows.
 *
 * Overrides only — a folder with nothing stored here falls back to whatever
 * `constants` authored, so the shipped look is the default rather than a copy
 * sitting in storage waiting to go stale.
 */
const useFolderStore = create<FolderStore>()(
  persist(
    (set) => ({
      looks: {},

      setLook: (item, look) =>
        set((state) => ({
          looks: {
            ...state.looks,
            [keyOf(item)]: { ...state.looks[keyOf(item)], ...look },
          },
        })),

      /* Deletes the entry rather than storing a set of "default" values, so a
         folder whose authored look changes later picks the new one up */
      resetLook: (item) =>
        set((state) => {
          const looks = { ...state.looks };
          delete looks[keyOf(item)];
          return { looks };
        }),
    }),
    { name: "portfolio-folders", version: 1 }
  )
);

export default useFolderStore;
