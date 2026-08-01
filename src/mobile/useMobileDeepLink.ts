import { useEffect } from "react";

import { APP_FOR_WINDOW, type MobileAppId } from "#mobile/constants";
import useMobileStore from "#mobile/store";
import { parseRoute, routeToHash, slug } from "#utils/routes";
import { locations } from "#constants/index";
import type { FinderItem } from "#types";

/**
 * The phone half of deep linking. One set of URLs serves both shells, which
 * matters because a link shared from a desktop is usually opened on a phone.
 *
 *   #/work/securevault  →  Files, already inside SecureVault
 *   #/articles          →  the Articles app
 *
 * Writing back is app-level only: Files reports its own depth as you drill in,
 * through `writeFilesHash`.
 */

/** Which Files path a route implies, if any. */
const pathFor = (route: ReturnType<typeof parseRoute>) =>
  route && route.path.length > 0 ? route.path : undefined;

const useMobileDeepLink = (enabled: boolean) => {
  const activeApp = useMobileStore((state) => state.activeApp);

  useEffect(() => {
    if (!enabled) return;

    const apply = () => {
      const route = parseRoute(window.location.hash);
      if (!route) return;

      useMobileStore
        .getState()
        .openApp(APP_FOR_WINDOW[route.window], { path: pathFor(route) });
    };

    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [enabled]);

  // Home Screen → URL. Files overwrites this as it goes deeper.
  useEffect(() => {
    if (!enabled) return;
    if (activeApp === "files") return; // Files writes its own, with its path

    writeHash(hashForApp(activeApp));
  }, [enabled, activeApp]);
};

/** The one place the address bar is written, so the rules stay in one file. */
export const writeHash = (hash: string) => {
  const target = hash === "#/" ? "" : hash;
  if (target === window.location.hash) return;

  window.history.replaceState(
    null,
    "",
    target || window.location.pathname + window.location.search
  );
};

const hashForApp = (app: MobileAppId | null): string => {
  switch (app) {
    case null:
    case "files":
      return "#/";
    case "articles":
      return routeToHash({ window: "safari", path: [] });
    case "gallery":
      return routeToHash({ window: "photos", path: [] });
    case "about":
      return routeToHash({ window: "about", path: [] });
    default:
      return `#/${app}`;
  }
};

/**
 * Files' own address, from the stack it is showing. The Home Screen is the
 * bare desktop, and a location the visitor walked into is a path.
 */
export const writeFilesHash = (stack: FinderItem[]) => {
  if (stack.length === 0) return writeHash("#/");

  // A stack seeded from Trash starts at its own root rather than at Work
  const known = Object.values(locations).some(
    (root) => slug(root.name) === slug(stack[0].name)
  );
  if (!known) return writeHash("#/");

  writeHash(`#/${stack.map((item) => slug(item.name)).join("/")}`);
};

export default useMobileDeepLink;
