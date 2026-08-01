import { useEffect, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import clsx from "clsx";

import { wallpaperNeedsDarkText } from "#utils/wallpaperLuminance";

import {
  Navbar,
  Welcome,
  Dock,
  Home,
  BootScreen,
  Spotlight,
  DesktopMenu,
  KeyboardShortcuts,
  SnapPreview,
  MissionControl,
  NotificationCenter,
} from "#components";
import {
  Finder,
  Resume,
  Safari,
  Terminal,
  Text,
  Image,
  Contact,
  Photos,
  Settings,
  About,
} from "#windows";
import MobileShell from "#mobile/MobileShell";
import useIsMobile from "#mobile/useIsMobile";
import useDeepLink from "#hooks/useDeepLink";
import useSystemStore from "#store/system";

gsap.registerPlugin(Draggable);

const App = () => {
  const wallpaper = useSystemStore((state) => state.wallpaper);
  const theme = useSystemStore((state) => state.theme);
  const brightness = useSystemStore((state) => state.brightness);
  const accent = useSystemStore((state) => state.accent);
  const iconStyle = useSystemStore((state) => state.iconStyle);
  const [lightMenuBar, setLightMenuBar] = useState(false);
  const isMobile = useIsMobile();

  // The phone shell reads the same URLs, but drives its own navigation with them
  useDeepLink(!isMobile);

  const backgroundImage =
    wallpaper.type === "gradient" ? wallpaper.value : `url(${wallpaper.value})`;

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

  useEffect(() => {
    let active = true;
    wallpaperNeedsDarkText(wallpaper).then((needsDark) => {
      if (active) setLightMenuBar(needsDark);
    });
    return () => {
      active = false;
    };
  }, [wallpaper]);

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
        lightMenuBar && "menu-bar-on-light"
      )}
    >
      {/*
        One shell or the other, never both. Below the breakpoint the desktop
        does not merely hide — it never mounts, so no window is left sized for a
        screen that isn't there and no Draggable is listening for a pointer the
        visitor doesn't have.
      */}
      {isMobile ? (
        <MobileShell />
      ) : (
        <>
          <Navbar />
          <Welcome />
          <Dock />

          <Terminal />
          <Safari />
          <Resume />
          <Finder />
          <Text />
          <Image />
          <Contact />
          <Photos />
          <Settings />
          <About />

          <Home />

          <DesktopMenu />
          <Spotlight />
          <KeyboardShortcuts />
          <SnapPreview />
          <MissionControl />
          <NotificationCenter />
        </>
      )}

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
