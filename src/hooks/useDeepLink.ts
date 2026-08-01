import { useEffect } from "react";

import useLocationStore from "#store/location";
import useWindowStore from "#store/window";
import { fileOf, folderOf, hashForState, parseRoute } from "#utils/routes";

/**
 * Points the URL at whatever is frontmost, and the desktop at whatever the URL
 * says — so a window can be linked to, and a refresh lands back where it was.
 *
 * Only the front window is written. Everything else that was open comes back
 * from the session (see the window store), which keeps the URL short enough to
 * paste into a message.
 */
/**
 * Opens whatever the URL names.
 *
 * Called once from `main.tsx` before the first render, not from an effect. The
 * writer below runs on mount too, and from an effect it would describe the
 * desktop as it stood *before* the URL was read — writing "#/work" over
 * "#/work/securevault" a frame before anything could correct it.
 */
export const applyHash = () => {
  const route = parseRoute(window.location.hash);
  if (!route) return;

  const folder = folderOf(route.path);
  if (folder) useLocationStore.getState().setActiveLocation(folder);

  const file = fileOf(route.path);
  // Finder opens behind the file, so a shared link lands on the file with the
  // folder around it rather than on a window from nowhere
  if (file && route.window !== "finder") {
    useWindowStore.getState().openWindow("finder");
  }

  useWindowStore.getState().openWindow(route.window, file ?? null);
};

const useDeepLink = (enabled: boolean) => {
  const activeWindow = useWindowStore((state) => state.activeWindow);
  const data = useWindowStore((state) =>
    state.activeWindow ? state.windows[state.activeWindow].data : null
  );
  const activeLocation = useLocationStore((state) => state.activeLocation);

  // The URL arrived before render; from here on, only edits to it matter
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [enabled]);

  // desktop → URL
  useEffect(() => {
    if (!enabled) return;

    // A bare desktop is the address with no hash at all, not "#/"
    const hash = hashForState(activeWindow, activeLocation, data);
    const target = hash === "#/" ? "" : hash;

    if (target === window.location.hash) return;

    // replaceState rather than assigning to location.hash: assigning fires
    // hashchange, which would feed straight back into the effect above. It also
    // keeps Back pointing at wherever the visitor came from, instead of at
    // every window they happened to focus on the way through.
    window.history.replaceState(
      null,
      "",
      target || window.location.pathname + window.location.search
    );
  }, [enabled, activeWindow, activeLocation, data]);
};

export default useDeepLink;
