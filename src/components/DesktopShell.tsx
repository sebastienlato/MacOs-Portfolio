import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

import {
  Navbar,
  Welcome,
  Dock,
  Spotlight,
  DesktopMenu,
  KeyboardShortcuts,
  SnapPreview,
  MissionControl,
  NotificationCenter,
  QuickLook,
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

/*
 * Registered here rather than in App, so that Draggable belongs to the desktop
 * chunk. A phone has no window to drag and should not be made to download the
 * code that would.
 */
gsap.registerPlugin(Draggable);

/**
 * Everything the desktop is: the chrome, the ten windows, and the pieces that
 * only exist to be summoned — Spotlight, Mission Control, the menus.
 *
 * Its own file purely so it can be its own bundle. `App` decides between this
 * and the phone at runtime, and pulling the tree out of that decision means the
 * one a visitor is not getting is never fetched. It is the same rule the shells
 * already followed — never both — carried back from what mounts to what loads.
 */
const DesktopShell = () => (
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

    <DesktopMenu />
    <Spotlight />
    <KeyboardShortcuts />
    <SnapPreview />
    <MissionControl />
    <NotificationCenter />
    <QuickLook />
  </>
);

export default DesktopShell;
