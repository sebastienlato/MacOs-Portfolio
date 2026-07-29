import { locations } from "#constants/index";
import type { MenuAction } from "#constants/menus";
import useLocationStore from "#store/location";
import useSystemStore from "#store/system";
import useWindowStore from "#store/window";

/**
 * Single place every menu item and keyboard shortcut resolves through, so a
 * shortcut and the menu item printing it can never drift apart.
 *
 * Reads stores via getState rather than hooks — the keyboard handler is a bare
 * window listener with no component to hang a subscription on.
 */
export const runMenuAction = (action: MenuAction) => {
  const {
    activeWindow,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
  } = useWindowStore.getState();

  switch (action) {
    // Window commands act on whatever is frontmost, and no-op with nothing open
    case "close":
      if (activeWindow) closeWindow(activeWindow);
      return;
    case "minimize":
      if (activeWindow) minimizeWindow(activeWindow);
      return;
    case "zoom":
      if (activeWindow) toggleMaximizeWindow(activeWindow);
      return;

    case "about":
      return openWindow("about");
    case "settings":
      return openWindow("settings");
    case "openTerminal":
      return openWindow("terminal");
    case "openResume":
      return openWindow("resume");
    case "openContact":
      return openWindow("contact");
    case "openPhotos":
      return openWindow("photos");
    case "openSafari":
      return openWindow("safari");

    case "newFinder":
      useLocationStore.getState().setActiveLocation(locations.work);
      return openWindow("finder");

    case "restart":
      return window.location.reload();
    case "spotlight":
      return useSystemStore.getState().toggleSpotlight();
    case "toggleTheme":
      return useSystemStore.getState().toggleTheme();

    case "downloadResume": {
      const link = document.createElement("a");
      link.href = "files/resume.pdf";
      link.download = "resume.pdf";
      link.click();
      return;
    }
  }
};
