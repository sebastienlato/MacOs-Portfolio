import { locations } from "#constants/index";
import type { FileType, FinderItem, WindowKey } from "#types";

/**
 * The desktop, addressable.
 *
 *   #/                                     the bare desktop
 *   #/work                                 Finder, showing Work
 *   #/work/securevault                     Finder, inside a project
 *   #/work/securevault/securevault-png     …with that file open on top
 *   #/about-me, #/trash                    the other Finder locations
 *   #/articles #/gallery #/contact         a window that is only itself
 *   #/terminal #/resume #/settings #/this-mac
 *
 * Segments are slugs of the names in `constants`, so a folder renamed there
 * changes its own URL and nothing has to be kept in step by hand.
 */

/** "SecureVault Project.txt" → "securevault-project-txt" */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Finder locations that can start a path.
 *
 * Resume is deliberately absent: it holds one PDF, and `#/resume` is far more
 * useful pointing at the document than at the folder around it.
 */
const ROOTS: FinderItem[] = [locations.work, locations.about, locations.trash];

/** Windows that are only themselves — no folder, no file. */
const APPS: Partial<Record<WindowKey, string>> = {
  safari: "articles",
  photos: "gallery",
  contact: "contact",
  terminal: "terminal",
  resume: "resume",
  settings: "settings",
  about: "this-mac",
};

/** Which window a file opens in. A .url or .fig is a link, so neither. */
const WINDOW_FOR_FILE: Partial<Record<FileType, WindowKey>> = {
  pdf: "resume",
  txt: "txtfile",
  img: "imgfile",
};

export interface Route {
  /** The window this URL brings to the front. */
  window: WindowKey;
  /**
   * Finder locations from a root downwards, with a file last when the URL goes
   * that deep. Empty for a window that stands alone.
   */
  path: FinderItem[];
}

/** The deepest folder in a path — what Finder should be showing. */
export const folderOf = (path: FinderItem[]) =>
  [...path].reverse().find((item) => item.kind === "folder");

export const fileOf = (path: FinderItem[]) =>
  path.at(-1)?.kind === "file" ? path.at(-1) : undefined;

const childBySlug = (parent: FinderItem, wanted: string) =>
  (parent.children ?? []).find((child) => slug(child.name) === wanted);

/** Everything down to `item`, or nothing if it is not in the tree. */
const pathTo = (item: FinderItem): FinderItem[] | null => {
  const wanted = slug(item.name);

  for (const root of ROOTS) {
    if (slug(root.name) === wanted) return [root];

    for (const child of root.children ?? []) {
      if (slug(child.name) === wanted) return [root, child];

      for (const file of child.children ?? []) {
        if (slug(file.name) === wanted) return [root, child, file];
      }
    }
  }

  return null;
};

export const parseRoute = (hash: string): Route | null => {
  const segments = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => slug(decodeURIComponent(segment)));

  if (segments.length === 0) return null;

  const [first, ...rest] = segments;

  const app = (Object.keys(APPS) as WindowKey[]).find(
    (key) => APPS[key] === first
  );
  if (app) return { window: app, path: [] };

  const root = ROOTS.find((item) => slug(item.name) === first);
  if (!root) return null;

  // Each segment that resolves goes deeper; the first that doesn't stops the
  // walk, so a stale or mistyped tail lands on the nearest real folder rather
  // than on nothing at all
  const path: FinderItem[] = [root];
  for (const segment of rest) {
    const next = childBySlug(path.at(-1)!, segment);
    if (!next) break;
    path.push(next);
  }

  const file = fileOf(path);
  if (!file) return { window: "finder", path };

  const window = file.fileType && WINDOW_FOR_FILE[file.fileType];
  // A link has no window of its own, so the folder holding it is as deep as
  // this goes
  if (!window) return { window: "finder", path: path.slice(0, -1) };

  return { window, path };
};

export const routeToHash = (route: Route): string => {
  const { window, path } = route;

  if (path.length > 0) {
    const segments = path.map((item) => slug(item.name));
    // A PDF is reachable as itself, which reads better than the path to it
    if (window === "resume" && fileOf(path)) return "#/resume";
    return `#/${segments.join("/")}`;
  }

  const app = APPS[window];
  return app ? `#/${app}` : "#/";
};

/**
 * The URL for what is currently frontmost.
 *
 * Only the front window is described. The URL stays something you would paste
 * into a message, and the rest of the desktop is restored from the session
 * instead — see the window store.
 */
export const hashForState = (
  activeWindow: WindowKey | null,
  activeLocation: FinderItem,
  data: FinderItem | null
): string => {
  if (!activeWindow) return "#/";

  if (activeWindow === "finder") {
    const path = pathTo(activeLocation);
    return path ? routeToHash({ window: "finder", path }) : "#/";
  }

  if (activeWindow === "txtfile" || activeWindow === "imgfile") {
    const path = data && pathTo(data);
    return path ? routeToHash({ window: activeWindow, path }) : "#/";
  }

  return routeToHash({ window: activeWindow, path: [] });
};
