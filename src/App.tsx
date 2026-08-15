import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
import clsx from "clsx";

import { wallpaperNeedsDarkText } from "#utils/wallpaperLuminance";

import { BootScreen } from "#components";
import useIsMobile from "#mobile/useIsMobile";
import useDeepLink from "#hooks/useDeepLink";
import useSystemStore from "#store/system";

/*
 * The two shells are the only lazy things in the app, and for one reason: a
 * visitor gets exactly one of them, so shipping both is shipping half the
 * bundle to nobody. The phone was downloading ten windows, the dock, Mission
 * Control and GSAP's Draggable to render a Home Screen that uses none of it.
 *
 * No fallback is needed. The boot screen is painted over the top of all this
 * and outlasts the fetch, so there is nothing to see while it arrives.
 */
const DesktopShell = lazy(() => import("#components/DesktopShell"));
const MobileShell = lazy(() => import("#mobile/MobileShell"));

const App = () => {
  const wallpaper = useSystemStore((state) => state.wallpaper);
  const theme = useSystemStore((state) => state.theme);
  const brightness = useSystemStore((state) => state.brightness);
  const accent = useSystemStore((state) => state.accent);
  const iconStyle = useSystemStore((state) => state.iconStyle);
  const reducedTransparency = useSystemStore(
    (state) => state.reducedTransparency
  );
  const [lightMenuBar, setLightMenuBar] = useState(false);
  const isMobile = useIsMobile();

  // The phone shell reads the same URLs, but drives its own navigation with them
  useDeepLink(!isMobile);

  /* The phone takes the smaller copy where there is one: same picture, a fifth
     of the bytes, arriving while the bundle is still loading rather than after
     it. Named once, because the luminance sampler has to read the same file —
     pointing the two at different copies fetched both. */
  const wallpaperSrc = (isMobile && wallpaper.mobileValue) || wallpaper.value;

  const backgroundImage =
    wallpaper.type === "gradient"
      ? wallpaper.value
      : `url(${wallpaperSrc})`;

  // Dim the whole screen like a real display when brightness drops below max
  const dimOpacity = Math.max(0, (100 - brightness) / 100) * 0.7;

  /**
   * The menu bar has no background of its own, so its tint comes from the
   * wallpaper underneath rather than from the appearance setting — the same
   * thing macOS does. Without this, white text lands on the yellow top of the
   * Sonoma gradient and disappears.
   */
  /**
   * Appearance "Auto" follows the OS. The stored theme already carries what it
   * resolved to last visit, so this is about catching the flip — either while
   * the tab is open, or because it happened since the visitor was last here.
   */
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => useSystemStore.getState().syncSystemTheme();

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  /**
   * The same arrangement for transparency. Watched rather than read once,
   * because this is the setting someone turns on *because* they are struggling
   * with what is on screen — having to reload to be taken seriously would be a
   * poor answer to that.
   */
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const sync = () => useSystemStore.getState().syncSystemTransparency();

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let active = true;
    wallpaperNeedsDarkText(wallpaper, wallpaperSrc).then((needsDark) => {
      if (active) setLightMenuBar(needsDark);
    });
    return () => {
      active = false;
    };
  }, [wallpaper, wallpaperSrc]);

  return (
    <main
      /* The accent is handed to CSS as a variable rather than a class, so one
         set of rules serves all eight colours and a ninth costs nothing */
      style={
        {
          backgroundImage,
          "--color-accent": accent.value,
          "--color-accent-on": accent.on,
        } as CSSProperties
      }
      className={clsx(
        "desktop",
        `icons-${iconStyle}`,
        theme === "dark" && "dark",
        lightMenuBar && "menu-bar-on-light",
        reducedTransparency && "reduce-transparency"
      )}
    >
      {/*
        One shell or the other, never both. Below the breakpoint the desktop
        does not merely hide — it never mounts, so no window is left sized for a
        screen that isn't there and no Draggable is listening for a pointer the
        visitor doesn't have. Nor is it fetched: see the imports.
      */}
      <Suspense fallback={null}>
        {isMobile ? <MobileShell /> : <DesktopShell />}
      </Suspense>

      <div
        className="brightness-overlay"
        style={{ opacity: dimOpacity }}
        aria-hidden="true"
      />

      <BootScreen />
    </main>
  );
};

export default App;
