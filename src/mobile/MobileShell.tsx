import { useEffect, type ComponentType } from "react";
import clsx from "clsx";

import ControlCenterSheet from "#mobile/ControlCenterSheet";
import Springboard from "#mobile/Springboard";
import StatusBar from "#mobile/StatusBar";
import useMobileStore from "#mobile/store";
import { appById, type MobileAppId } from "#mobile/constants";

import AboutApp from "#mobile/apps/AboutApp";
import ArticlesApp from "#mobile/apps/ArticlesApp";
import ContactApp from "#mobile/apps/ContactApp";
import FilesApp from "#mobile/apps/FilesApp";
import GalleryApp from "#mobile/apps/GalleryApp";
import ResumeApp from "#mobile/apps/ResumeApp";
import SettingsApp from "#mobile/apps/SettingsApp";
import TerminalApp from "#mobile/apps/TerminalApp";

const APPS: Record<MobileAppId, ComponentType> = {
  files: FilesApp,
  articles: ArticlesApp,
  gallery: GalleryApp,
  contact: ContactApp,
  resume: ResumeApp,
  terminal: TerminalApp,
  settings: SettingsApp,
  about: AboutApp,
};

/**
 * The phone shell: a Home Screen with one app open over it at a time.
 *
 * Apps are keyed on the active id so switching between them (which the terminal
 * can do) remounts rather than reconciles — each app owns its own navigation
 * stack, and a stack carried over from the last app would be nonsense.
 */
const MobileShell = () => {
  const activeApp = useMobileStore((state) => state.activeApp);
  const launch = useMobileStore((state) => state.launch);
  const handleBack = useMobileStore((state) => state.handleBack);

  /**
   * Back leaves the app, not the site. Every app sits at one history entry
   * deep, so the gesture is a single, predictable step out to the Home Screen
   * from however far into an app the visitor has drilled.
   */
  useEffect(() => {
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [handleBack]);

  const ActiveApp = activeApp ? APPS[activeApp] : null;

  return (
    <div
      className={clsx(
        "mobile-shell",
        activeApp && "app-open",
        // The status bar sits above the app, so it has to know when the app
        // below it is dark whatever the appearance setting says
        appById(activeApp)?.variant === "dark" && "app-dark"
      )}
    >
      <StatusBar />

      <Springboard />

      {ActiveApp && <ActiveApp key={launch} />}

      <ControlCenterSheet />
    </div>
  );
};

export default MobileShell;
