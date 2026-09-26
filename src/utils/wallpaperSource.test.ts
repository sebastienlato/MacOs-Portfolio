import { describe, expect, it } from "vitest";

import { wallpapers } from "#constants/index";
import type { Wallpaper } from "#types";
import { wallpaperBackground, wallpaperSource } from "#utils/wallpaperSource";

const dynamic: Wallpaper = {
  id: "dyn",
  name: "Dynamic",
  type: "image",
  value: "/light.webp",
  mobileValue: "/light-mobile.webp",
  dark: { value: "/dark.webp", mobileValue: "/dark-mobile.webp" },
};

describe("wallpaperSource", () => {
  it("picks the dark picture only in dark mode", () => {
    expect(wallpaperSource(dynamic, { theme: "light" })).toBe("/light.webp");
    expect(wallpaperSource(dynamic, { theme: "dark" })).toBe("/dark.webp");
  });

  it("takes the phone copy of whichever picture is showing", () => {
    expect(wallpaperSource(dynamic, { mobile: true })).toBe(
      "/light-mobile.webp"
    );
    expect(wallpaperSource(dynamic, { mobile: true, theme: "dark" })).toBe(
      "/dark-mobile.webp"
    );
  });

  it("falls back to the full file when there is no phone copy", () => {
    const still: Wallpaper = {
      ...dynamic,
      mobileValue: undefined,
      dark: { value: "/d.webp" },
    };
    expect(wallpaperSource(still, { mobile: true, theme: "dark" })).toBe(
      "/d.webp"
    );
    expect(wallpaperSource(still, { mobile: true })).toBe("/light.webp");
  });

  it("ignores the appearance for a wallpaper with one picture", () => {
    const light: Wallpaper = { ...dynamic, dark: undefined };
    expect(wallpaperSource(light, { theme: "dark" })).toBe("/light.webp");
  });

  it("wraps images in url() and passes gradients straight through", () => {
    expect(wallpaperBackground(dynamic)).toBe("url(/light.webp)");
    const gradient = wallpapers.find((wp) => wp.type === "gradient")!;
    expect(wallpaperBackground(gradient)).toBe(gradient.value);
  });

  it("ships macOS 27's default as a light/dark pair", () => {
    const goldenGate = wallpapers.find((wp) => wp.id === "golden-gate");
    expect(goldenGate?.dark?.value).toBeTruthy();
    expect(goldenGate?.dark?.value).not.toBe(goldenGate?.value);
  });
});
