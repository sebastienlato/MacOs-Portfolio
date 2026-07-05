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
  /** Tailwind classes positioning the icon inside a Finder window. */
  position?: string;
  /** Tailwind classes positioning a Finder window opened from the desktop. */
  windowPosition?: string;
  imageUrl?: string;
  image?: string;
  subtitle?: string;
  description?: string[];
  children?: FinderItem[];
}

export interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  data: FinderItem | null;
}

export type Theme = "light" | "dark";

export interface Wallpaper {
  id: string;
  name: string;
  type: "image" | "gradient";
  value: string;
}

export interface DockApp {
  id: string;
  name: string;
  icon: string;
  canOpen: boolean;
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
