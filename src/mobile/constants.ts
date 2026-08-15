import { FileText, Folder, Info, Settings, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { socials } from "#constants/index";
import type { WindowKey } from "#types";

/**
 * Every full-screen app the phone shell can open.
 *
 * No terminal. iOS has never shipped one, and a phone that offers a shell is
 * the single loudest way this shell could announce it is not a phone — the
 * command chips under the keyboard were a desktop affordance wearing an iOS
 * coat. The desktop keeps its terminal; `#/terminal` simply has no counterpart
 * to land on here, which `APP_FOR_WINDOW` says out loud.
 */
export type MobileAppId =
  | "files"
  | "articles"
  | "gallery"
  | "contact"
  | "resume"
  | "settings"
  | "about";

export interface MobileApp {
  id: MobileAppId;
  /** Under the icon on the Home Screen. */
  name: string;
  /** In the app's own navigation bar. */
  title: string;
  /** An icon image, or a glyph drawn on a tinted tile when there is no art. */
  icon?: string;
  Glyph?: LucideIcon;
  tint?: string;
  /** Dock apps are pinned to the bottom and left off the grid, as on iOS. */
  inDock?: boolean;
}

export const MOBILE_APPS: MobileApp[] = [
  {
    id: "files",
    name: "Portfolio",
    title: "Portfolio",
    /*
     * A folder rather than the Finder's face. Finder is a Mac application and
     * has no counterpart on a phone — iOS puts this content in Files — so its
     * artwork was the one icon here that read as belonging to another
     * operating system. Safari and Photos keep theirs precisely because iOS
     * ships icons that look the same.
     */
    /*
     * Lighter than Files' own blue, because of where it sits. Against the
     * dock's glass — itself a pale blue over a blue wallpaper — the true colour
     * came out at 1.63:1, where the amber beside it manages 2.94 and reads as
     * an icon rather than a smudge. This lifts it to 2.33.
     *
     * Not further: the next step up measured 2.77 and went pale with it,
     * reading as a disabled tile and starting to compete with Safari's white
     * one two along. Contrast is not the only thing being spent here.
     */
    Glyph: Folder,
    tint: "linear-gradient(160deg, #8ecdff 0%, #2f86ef 100%)",
    inDock: true,
  },
  {
    id: "articles",
    name: "Articles",
    title: "Articles",
    icon: "/images/safari.png",
    inDock: true,
  },
  {
    id: "contact",
    name: "Contact",
    title: "Contact",
    /* The macOS artwork is a brown leather address book, which dates the whole
       dock. Warm enough to nod at it, without the texture. */
    Glyph: UserRound,
    tint: "linear-gradient(160deg, #ffc46b 0%, #ef8f28 100%)",
    inDock: true,
  },
  {
    id: "gallery",
    name: "Gallery",
    title: "Gallery",
    icon: "/images/photos.png",
    /*
     * The fourth, filling the place the terminal left. Three icons spread
     * across a full-width dock sit far enough apart to read as three things
     * rather than a set — and of everything on this Home Screen, Photos is the
     * one an actual iPhone is most likely to have down there.
     *
     * It costs the grid its two clean rows: seven tiles wrap to four and three,
     * which puts a link on the end of the app row. That is what an iPhone looks
     * like — a grid fills in order and the last row is however long it is —
     * whereas a dock left short reads as a dock missing something.
     */
    inDock: true,
  },
  {
    id: "resume",
    name: "Resume",
    title: "Resume",
    // The desktop's pdf.png is a picture of a page, which reads as a file
    // sitting among apps rather than as one of them
    Glyph: FileText,
    tint: "linear-gradient(160deg, #ff8a7a 0%, #e0362a 100%)",
  },
  {
    id: "about",
    name: "About",
    title: "About This Device",
    Glyph: Info,
    tint: "linear-gradient(160deg, #4f9dff 0%, #1a63d8 100%)",
  },
  {
    id: "settings",
    name: "Settings",
    title: "Settings",
    Glyph: Settings,
    tint: "linear-gradient(160deg, #b8bcc4 0%, #7e838d 100%)",
  },
];

export const DOCK_APPS = MOBILE_APPS.filter((app) => app.inDock);
export const GRID_APPS = MOBILE_APPS.filter((app) => !app.inDock);

/**
 * Web tiles, the way a Home Screen carries shortcuts alongside real apps. They
 * reuse the contact list rather than restating it, so a link only ever changes
 * in one place.
 */
export interface MobileLink {
  id: number;
  name: string;
  icon: string;
  tint: string;
  href: string;
}

export const HOME_LINKS: MobileLink[] = socials.map(
  ({ id, text, icon, bg, link }) => ({
    id,
    name: text === "Platform" ? "Website" : text,
    icon,
    tint: bg,
    href: link,
  })
);

/**
 * Which app a desktop window's URL opens on a phone, so one link works on both.
 * Files stands in for anything that is a folder or a file on the desktop.
 *
 * `null` where the phone has no such app. Only the terminal is one, and the
 * honest thing for `#/terminal` to do here is land on the Home Screen rather
 * than open something the link never asked for — a visitor following a shared
 * terminal link would otherwise arrive in Settings wondering what happened.
 */
export const APP_FOR_WINDOW: Record<WindowKey, MobileAppId | null> = {
  finder: "files",
  txtfile: "files",
  imgfile: "files",
  safari: "articles",
  photos: "gallery",
  contact: "contact",
  resume: "resume",
  terminal: null,
  settings: "settings",
  about: "about",
};
