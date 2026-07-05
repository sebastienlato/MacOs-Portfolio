import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import clsx from "clsx";

import {
  Navbar,
  Welcome,
  Dock,
  Home,
  BootScreen,
  Spotlight,
  DesktopMenu,
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
import useSystemStore from "#store/system";

gsap.registerPlugin(Draggable);

const App = () => {
  const wallpaper = useSystemStore((state) => state.wallpaper);
  const theme = useSystemStore((state) => state.theme);
  const brightness = useSystemStore((state) => state.brightness);

  const backgroundImage =
    wallpaper.type === "gradient" ? wallpaper.value : `url(${wallpaper.value})`;

  // Dim the whole screen like a real display when brightness drops below max
  const dimOpacity = Math.max(0, (100 - brightness) / 100) * 0.7;

  return (
    <main
      style={{ backgroundImage }}
      className={clsx("desktop", theme === "dark" && "dark")}
    >
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
