import { describe, expect, it, beforeEach } from "vitest";
import useFolderStore, { badgeOf, keyOf } from "#store/folders";
import { locations } from "#constants/index";

const work = locations.work;
const [secureVault, petSitter] = work.children ?? [];

const reset = () => useFolderStore.setState({ looks: {} });

describe("folder looks", () => {
  beforeEach(reset);

  it("keys by slug, since ids repeat between folders", () => {
    // Both projects' children are 1, 2 and 4 — id alone would collide
    expect(keyOf(secureVault)).toBe("securevault");
    expect(keyOf(petSitter)).toBe("petsitterqr");
    expect(keyOf(secureVault)).not.toBe(keyOf(petSitter));
  });

  it("customising one folder leaves its siblings alone", () => {
    useFolderStore.getState().setLook(secureVault, { color: "pink" });
    const { looks } = useFolderStore.getState();
    expect(looks[keyOf(secureVault)]).toEqual({ color: "pink" });
    expect(looks[keyOf(petSitter)]).toBeUndefined();
  });

  it("merges rather than replacing, so colour survives a badge change", () => {
    const { setLook } = useFolderStore.getState();
    setLook(secureVault, { color: "pink" });
    setLook(secureVault, { badge: "star" });
    expect(useFolderStore.getState().looks[keyOf(secureVault)]).toEqual({
      color: "pink",
      badge: "star",
    });
  });

  it("reset deletes the entry rather than storing defaults", () => {
    const { setLook, resetLook } = useFolderStore.getState();
    setLook(secureVault, { color: "pink" });
    resetLook(secureVault);
    expect(useFolderStore.getState().looks).toEqual({});
  });
});

describe("badgeOf", () => {
  it("falls back to the authored badge when untouched", () => {
    expect(badgeOf(undefined, "lock")).toBe("lock");
    expect(badgeOf({ color: "pink" }, "lock")).toBe("lock");
  });

  it("prefers an explicit choice", () => {
    expect(badgeOf({ badge: "star" }, "lock")).toBe("star");
  });

  it('treats "none" as removed, not as unset', () => {
    expect(badgeOf({ badge: "none" }, "lock")).toBeUndefined();
  });
});
