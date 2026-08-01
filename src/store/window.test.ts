import { beforeEach, describe, expect, it } from "vitest";

import { INITIAL_Z_INDEX, WINDOW_CONFIG, locations } from "#constants/index";
import useWindowStore from "#store/window";
import type { WindowKey } from "#types";

/**
 * The store is the desktop's memory of what is where. What matters is not each
 * field on its own but the order between windows: which one the menu bar is
 * describing, and which one is painted on top. Both are easy to break with a
 * change that looks local.
 */

const state = () => useWindowStore.getState();
const win = (key: WindowKey) => state().windows[key];

beforeEach(() => {
  // A fresh desktop per test. The config is shared between them, so it is
  // cloned rather than handed over — immer copies on write, but a test that
  // reached past the store would poison every test after it.
  useWindowStore.setState({
    windows: structuredClone(WINDOW_CONFIG),
    nextZIndex: INITIAL_Z_INDEX + 1,
    activeWindow: null,
    missionControl: false,
  });
});

describe("openWindow", () => {
  it("opens, focuses, and remembers that it has been opened", () => {
    state().openWindow("finder");

    expect(win("finder").isOpen).toBe(true);
    expect(win("finder").isMinimized).toBe(false);
    expect(win("finder").hasOpened).toBe(true);
    expect(state().activeWindow).toBe("finder");
  });

  it("puts each newly opened window above the last", () => {
    state().openWindow("finder");
    state().openWindow("terminal");

    expect(win("terminal").zIndex).toBeGreaterThan(win("finder").zIndex);
    expect(state().activeWindow).toBe("terminal");
  });

  it("brings a minimized window back rather than leaving it in the dock", () => {
    state().openWindow("finder");
    state().minimizeWindow("finder");
    state().openWindow("finder");

    expect(win("finder").isMinimized).toBe(false);
    expect(state().activeWindow).toBe("finder");
  });

  it("keeps what the window was showing when it is reopened with nothing", () => {
    state().openWindow("finder", locations.work);
    state().openWindow("finder");

    expect(win("finder").data).toEqual(locations.work);
  });

  it("leaves the overview, since opening something is choosing something", () => {
    state().toggleMissionControl();
    state().openWindow("finder");

    expect(state().missionControl).toBe(false);
  });

  it("ignores a key that names no window", () => {
    state().openWindow("nope" as WindowKey);

    expect(state().activeWindow).toBeNull();
  });
});

describe("focus handoff", () => {
  it("hands the menu bar to what is left when the front window closes", () => {
    state().openWindow("finder");
    state().openWindow("terminal");
    state().closeWindow("terminal");

    expect(state().activeWindow).toBe("finder");
  });

  it("hands it to the deepest survivor, not simply the previous one", () => {
    state().openWindow("finder");
    state().openWindow("terminal");
    state().openWindow("settings");
    state().focusWindow("finder");
    state().closeWindow("finder");

    // Terminal was opened before Settings, but Settings is the higher of the
    // two — the stack decides, not the order they were opened in
    expect(state().activeWindow).toBe("settings");
  });

  it("leaves the front window alone when something behind it closes", () => {
    state().openWindow("finder");
    state().openWindow("terminal");
    state().closeWindow("finder");

    expect(state().activeWindow).toBe("terminal");
  });

  it("points at nothing once the desktop is empty", () => {
    state().openWindow("finder");
    state().closeWindow("finder");

    expect(state().activeWindow).toBeNull();
  });

  it("skips minimized windows when it looks for the next one", () => {
    state().openWindow("finder");
    state().openWindow("terminal");
    state().minimizeWindow("finder");
    state().minimizeWindow("terminal");

    expect(state().activeWindow).toBeNull();
  });

  it("raises a window that was already open above the rest", () => {
    state().openWindow("finder");
    state().openWindow("terminal");
    state().focusWindow("finder");

    expect(win("finder").zIndex).toBeGreaterThan(win("terminal").zIndex);
    expect(state().activeWindow).toBe("finder");
  });

  it("leaves the overview when a window is picked out of it", () => {
    state().openWindow("finder");
    state().toggleMissionControl();
    state().focusWindow("finder");

    expect(state().missionControl).toBe(false);
  });
});

describe("closeWindow", () => {
  it("puts the window back the way it was found", () => {
    state().openWindow("finder", locations.work);
    state().tileWindow("finder", "left");
    state().closeWindow("finder");

    expect(win("finder")).toMatchObject({
      isOpen: false,
      isMinimized: false,
      tile: null,
      zIndex: INITIAL_Z_INDEX,
      data: null,
    });
  });

  it("remembers that it was once opened, so it stays mounted", () => {
    state().openWindow("finder");
    state().closeWindow("finder");

    expect(win("finder").hasOpened).toBe(true);
  });
});

describe("minimizeWindow", () => {
  it("leaves the window open, only out of the way", () => {
    state().openWindow("finder");
    state().minimizeWindow("finder");

    expect(win("finder").isOpen).toBe(true);
    expect(win("finder").isMinimized).toBe(true);
  });
});

describe("tiling and zoom", () => {
  it("tiles to a side and focuses what it tiled", () => {
    state().openWindow("finder");
    state().openWindow("terminal");
    state().tileWindow("finder", "left");

    expect(win("finder").tile).toBe("left");
    expect(state().activeWindow).toBe("finder");
    expect(win("finder").zIndex).toBeGreaterThan(win("terminal").zIndex);
  });

  it("sets a window free again", () => {
    state().openWindow("finder");
    state().tileWindow("finder", "right");
    state().tileWindow("finder", null);

    expect(win("finder").tile).toBeNull();
  });

  it("zooms and unzooms against fill", () => {
    state().openWindow("finder");

    state().toggleZoom("finder");
    expect(win("finder").tile).toBe("fill");

    state().toggleZoom("finder");
    expect(win("finder").tile).toBeNull();
  });

  it("fills from a half tile rather than restoring, the way the green button does", () => {
    state().openWindow("finder");
    state().tileWindow("finder", "left");
    state().toggleZoom("finder");

    expect(win("finder").tile).toBe("fill");
  });
});

describe("missionControl", () => {
  it("is a thing you are doing, so it toggles both ways", () => {
    state().toggleMissionControl();
    expect(state().missionControl).toBe(true);

    state().toggleMissionControl();
    expect(state().missionControl).toBe(false);
  });
});
