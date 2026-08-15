import { describe, expect, it, beforeEach } from "vitest";
import useClipboardStore from "#store/clipboard";

const reset = () => useClipboardStore.setState({ entries: [] });

describe("clipboard history", () => {
  beforeEach(reset);

  it("keeps the newest first", () => {
    const { record } = useClipboardStore.getState();
    record("first", "A");
    record("second", "B");
    expect(useClipboardStore.getState().entries.map((e) => e.text)).toEqual([
      "second",
      "first",
    ]);
  });

  it("moves a repeat to the top instead of duplicating it", () => {
    const { record } = useClipboardStore.getState();
    record("a", "A");
    record("b", "B");
    record("a", "A");
    expect(useClipboardStore.getState().entries.map((e) => e.text)).toEqual([
      "a",
      "b",
    ]);
  });

  it("caps the list", () => {
    const { record } = useClipboardStore.getState();
    for (let i = 0; i < 20; i++) record(`entry-${i}`, "X");
    expect(useClipboardStore.getState().entries).toHaveLength(12);
    expect(useClipboardStore.getState().entries[0].text).toBe("entry-19");
  });
});
