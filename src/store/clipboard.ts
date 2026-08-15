import { create } from "zustand";

export interface ClipEntry {
  id: string;
  /** What went on the clipboard, and what goes back on it if picked again. */
  text: string;
  /** What to call it in the list — "Email address" rather than the address. */
  label: string;
}

interface ClipboardStore {
  entries: ClipEntry[];
  record: (text: string, label: string) => void;
}

/** As many as Spotlight can show without the list becoming its own problem. */
const LIMIT = 12;

/**
 * What this desktop has put on the clipboard, newest first.
 *
 * Deliberately not persisted. The real Clipboard History expires after eight
 * hours; a portfolio has no business keeping what a visitor copied beyond the
 * visit, and localStorage would do exactly that. It also cannot be read back
 * from the system — the clipboard is write-only to a page without a permission
 * prompt — so this records what *we* put there and nothing else, which is the
 * honest limit of it.
 */
const useClipboardStore = create<ClipboardStore>()((set) => ({
  entries: [],

  record: (text, label) =>
    set((state) => ({
      // Copying the same thing twice moves it to the top rather than repeating
      entries: [
        { id: `${Date.now()}-${text}`, text, label },
        ...state.entries.filter((entry) => entry.text !== text),
      ].slice(0, LIMIT),
    })),
}));

export default useClipboardStore;
