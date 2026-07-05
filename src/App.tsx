import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

import { Navbar, Welcome, Dock, Home, BootScreen, Spotlight } from "#components";
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

  const backgroundImage =
    wallpaper.type === "gradient" ? wallpaper.value : `url(${wallpaper.value})`;

  return (
    <main style={{ backgroundImage }} className="desktop">
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

      <Spotlight />
      <BootScreen />
    </main>
  );
};

export default App;
