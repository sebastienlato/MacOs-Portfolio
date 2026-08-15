import { FileText, Folder, Info, Settings, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { socials } from "#constants/index";
import type { TerminalTarget } from "#utils/terminal";
import type { WindowKey } from "#types";

/** Every full-screen app the phone shell can open. */
export type MobileAppId =
  | "files"
  | "articles"
  | "gallery"
  | "contact"
  | "resume"
  | "terminal"
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
  /**
   * An app that is dark whatever the appearance setting says — the terminal is
   * a terminal in both. It takes the dark palette, and the status bar above it
   * has to follow, which is why this lives here rather than inside the app.
   */
  variant?: "dark";
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
    Glyph: Folder,
    tint: "linear-gradient(160deg, #5ab0ff 0%, #0a63d8 100%)",
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
    id: "terminal",
    name: "Terminal",
    title: "Terminal",
    icon: "/images/terminal.png",
    inDock: true,
    variant: "dark",
  },
  {
    id: "gallery",
    name: "Gallery",
    title: "Gallery",
    icon: "/images/photos.png",
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

export const appById = (id: MobileAppId | null) =>
  id ? MOBILE_APPS.find((app) => app.id === id) : undefined;

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
 */
export const APP_FOR_WINDOW: Record<WindowKey, MobileAppId> = {
  finder: "files",
  txtfile: "files",
  imgfile: "files",
  safari: "articles",
  photos: "gallery",
  contact: "contact",
  resume: "resume",
  terminal: "terminal",
  settings: "settings",
  about: "about",
};

/** Where the terminal's `open <app>` lands on a phone. */
export const APP_FOR_TARGET: Record<TerminalTarget, MobileAppId> = {
  finder: "files",
  safari: "articles",
  photos: "gallery",
  contact: "contact",
  resume: "resume",
  terminal: "terminal",
  settings: "settings",
  about: "about",
  // No Trash app on a phone — deleted things live inside Files, as on iOS
  trash: "files",
};
