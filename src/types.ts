/** Every window the OS can manage, keyed by its DOM/section id. */
export type WindowKey =
  | "finder"
  | "contact"
  | "resume"
  | "safari"
  | "photos"
  | "terminal"
  | "txtfile"
  | "imgfile"
  | "settings"
  | "about";

export type FileType = "txt" | "url" | "img" | "fig" | "pdf";

/** A file or folder shown in Finder / on the desktop. */
export interface FinderItem {
  id: number;
  name: string;
  icon: string;
  kind: "folder" | "file";
  /** Location type for top-level locations (work, about, resume, trash). */
  type?: string;
  fileType?: FileType;
  href?: string;
  /**
   * Tailwind classes placing this item's icon on the desktop — where it starts,
   * before anyone drags it. Only the top-level projects carry one.
   */
  desktopPosition?: string;
  imageUrl?: string;
  image?: string;
  subtitle?: string;
  description?: string[];
  children?: FinderItem[];
}

/**
 * Where a tiled window sits. "fill" is what the green button does on its own —
 * macOS calls that Zoom — and the halves are what its hover menu offers.
 */
export type WindowTile = "fill" | "left" | "right";

export interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  /** null while the window floats freely; otherwise where it is tiled. */
  tile: WindowTile | null;
  /**
   * Latches on the first open. Windows stay unmounted until then so their
   * images aren't fetched on page load; once mounted they stay mounted, which
   * keeps per-window state (terminal history, scroll position) across closes.
   */
  hasOpened: boolean;
  zIndex: number;
  data: FinderItem | null;
}

export type Theme = "light" | "dark";

/**
 * What the visitor picked in Settings. "auto" isn't a theme of its own — it
 * defers to the OS's prefers-color-scheme and re-resolves when that flips.
 */
export type Appearance = Theme | "auto";

export interface Wallpaper {
  id: string;
  name: string;
  type: "image" | "gradient";
  value: string;
}

/** The colour macOS runs through selections, highlights and the focus ring. */
export interface Accent {
  id: string;
  name: string;
  value: string;
  /** Text drawn on top of the accent — not white for the pale ones. */
  on: string;
}

/**
 * macOS 26's icon appearances. "Default" is the artwork as drawn; the other
 * three are recolourings of it, which is why they can be approximated here
 * from the same flat images.
 */
export type IconStyle = "default" | "dark" | "clear" | "tinted";

export interface DockApp {
  id: string;
  name: string;
  icon: string;
  canOpen: boolean;
  /** Draws the dock's vertical rule to the left of this app. */
  separatorBefore?: boolean;
}

export interface BlogPost {
  id: number;
  date: string;
  title: string;
  image: string;
  link: string;
}

export interface TechStackEntry {
  category: string;
  items: string[];
}

export interface Social {
  id: number;
  text: string;
  icon: string;
  bg: string;
  link: string;
}
