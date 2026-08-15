import { describe, expect, it } from "vitest";

import { isArrowKey, nextIndex } from "#utils/gridNav";

/**
 * The grid these describe is three wide and seven long, so the last row is
 * short on purpose — that ragged row is where every off-by-one lives:
 *
 *   0 1 2
 *   3 4 5
 *   6
 */
const THREE_WIDE = { columns: 3, count: 7 };

const move = (
  from: number,
  key: Parameters<typeof nextIndex>[1],
  { columns, count } = THREE_WIDE
) => nextIndex(from, key, columns, count);

describe("isArrowKey", () => {
  it("names the four arrows and nothing else", () => {
    expect(isArrowKey("ArrowUp")).toBe(true);
    expect(isArrowKey("ArrowRight")).toBe(true);
    expect(isArrowKey("Enter")).toBe(false);
    expect(isArrowKey(" ")).toBe(false);
    // The one that reads like an arrow and is not
    expect(isArrowKey("Up")).toBe(false);
  });
});

describe("nextIndex", () => {
  it("steps left and right through the flow, across row edges", () => {
    expect(move(0, "ArrowRight")).toBe(1);
    expect(move(1, "ArrowLeft")).toBe(0);

    // The point of stepping the flow rather than the row: right from the end of
    // a row continues onto the next, so one key walks the whole folder
    expect(move(2, "ArrowRight")).toBe(3);
    expect(move(3, "ArrowLeft")).toBe(2);
  });

  it("jumps a whole row up and down", () => {
    expect(move(0, "ArrowDown")).toBe(3);
    expect(move(5, "ArrowUp")).toBe(2);
  });

  it("refuses to move past either end rather than wrapping", () => {
    expect(move(0, "ArrowLeft")).toBeNull();
    expect(move(6, "ArrowRight")).toBeNull();
    expect(move(1, "ArrowUp")).toBeNull();
    expect(move(6, "ArrowDown")).toBeNull();
  });

  it("lands on the nearest icon when the row below is short", () => {
    // Nothing sits directly under 4 or 5 — the last row holds only 6
    expect(move(3, "ArrowDown")).toBe(6);
    expect(move(4, "ArrowDown")).toBe(6);
    expect(move(5, "ArrowDown")).toBe(6);
  });

  it("treats a full last row as the bottom, with nothing below it", () => {
    const full = { columns: 3, count: 6 };
    expect(move(3, "ArrowDown", full)).toBeNull();
    expect(move(5, "ArrowDown", full)).toBeNull();
    expect(move(0, "ArrowDown", full)).toBe(3);
  });

  it("degrades to a plain list one icon wide", () => {
    const column = { columns: 1, count: 3 };
    expect(move(0, "ArrowDown", column)).toBe(1);
    expect(move(2, "ArrowUp", column)).toBe(1);
    expect(move(2, "ArrowDown", column)).toBeNull();
    // Left and right still walk the flow, which one column makes identical
    expect(move(0, "ArrowRight", column)).toBe(1);
  });

  it("survives a width the layout could not report honestly", () => {
    // A pane that is not laid out yet reports no tracks at all. Falling back to
    // one column is wrong-but-harmless; dividing by zero is neither.
    expect(nextIndex(0, "ArrowDown", 0, 3)).toBe(1);
    expect(nextIndex(0, "ArrowDown", -4, 3)).toBe(1);
  });

  it("goes nowhere from outside the list, or from an empty one", () => {
    expect(move(-1, "ArrowRight")).toBeNull();
    expect(move(7, "ArrowLeft")).toBeNull();
    expect(nextIndex(0, "ArrowDown", 3, 0)).toBeNull();
  });

  it("reaches every icon by pressing one key", () => {
    // The guarantee the flow buys: no icon is stranded, and the walk ends
    const visited: number[] = [];
    let at: number | null = 0;

    while (at !== null) {
      visited.push(at);
      at = move(at, "ArrowRight");
    }

    expect(visited).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
