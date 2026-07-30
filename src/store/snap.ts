import { create } from "zustand";
import type { WindowTile } from "#types";

interface SnapStore {
  /** The region a dragged window would tile into on release, if any. */
  zone: WindowTile | null;
  setZone: (zone: WindowTile | null) => void;
}

/**
 * Deliberately its own store rather than a field on the window store: this is
 * written on every frame of a drag, and WindowWrapper subscribes to the whole
 * window store, so putting it there would re-render all ten windows per frame.
 * Only the preview overlay subscribes here.
 */
const useSnapStore = create<SnapStore>((set) => ({
  zone: null,
  // No-op when unchanged, so holding still inside a zone doesn't churn renders
  setZone: (zone) => set((state) => (state.zone === zone ? state : { zone })),
}));

export default useSnapStore;
