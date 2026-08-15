/**
 * Where an arrow key lands in a grid of icons.
 *
 * Kept apart from the Finder because the awkward part is arithmetic, not DOM:
 * the ragged last row, the edges that must refuse to move, and the fact that a
 * resizable window changes the width under all of it. Pulled out here it can be
 * asserted directly — the test suite runs in node, so a component could not be.
 */

const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;

export type ArrowKey = (typeof ARROWS)[number];

export const isArrowKey = (key: string): key is ArrowKey =>
  (ARROWS as readonly string[]).includes(key);

/**
 * The index an arrow moves to, or `null` when it has nowhere to go.
 *
 * `null` rather than "stay put" so the caller can tell the two apart: a key
 * that moved nothing is a key macOS lets alone, and the distinction is what
 * keeps a dead arrow from being swallowed silently.
 *
 * Left and right step through the *flow*, so they cross a row edge rather than
 * stopping at one — right from the last icon of a row lands on the first of the
 * next, which is what makes the whole folder walkable on one key. Up and down
 * jump a whole row. Neither wraps at the ends of the list; the Finder does not,
 * and a selection that leaps from the last icon back to the first reads as a
 * bug however it is explained.
 */
export const nextIndex = (
  from: number,
  key: ArrowKey,
  columns: number,
  count: number
): number | null => {
  const last = count - 1;
  if (from < 0 || from > last) return null;

  // A grid is never zero icons wide, but `columns` is measured from the
  // rendered layout and a hidden or unlaid-out pane can report nonsense. One
  // column degrades to a plain list rather than dividing by zero.
  const width = Math.max(1, Math.floor(columns));

  if (key === "ArrowLeft" || key === "ArrowRight") {
    const to = from + (key === "ArrowRight" ? 1 : -1);
    return to < 0 || to > last ? null : to;
  }

  const row = Math.floor(from / width);
  if (key === "ArrowUp") return row === 0 ? null : from - width;

  // Down out of the bottom row goes nowhere. Down *into* a short last row is
  // different: there may be no icon directly beneath, and the Finder lands on
  // the nearest one in that direction rather than refusing to move — which,
  // reading left to right, is always the final icon.
  if (row === Math.floor(last / width)) return null;
  return Math.min(from + width, last);
};
