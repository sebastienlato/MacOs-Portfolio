import type { WindowKey } from "#types";

/** Things a menu item can actually do. Anything else is shown disabled. */
export type MenuAction =
  | "close"
  | "minimize"
  | "zoom"
  | "about"
  | "settings"
  | "restart"
  | "newFinder"
  | "openTerminal"
  | "openResume"
  | "openContact"
  | "openPhotos"
  | "openSafari"
  | "spotlight"
  | "toggleTheme"
  | "downloadResume";

export interface MenuItemDef {
  id: string;
  label?: string;
  shortcut?: string;
  action?: MenuAction;
  divider?: boolean;
  /**
   * macOS greys out what doesn't apply rather than hiding it, and an item with
   * no action would otherwise look clickable and do nothing.
   */
  disabled?: boolean;
}

export interface MenuDef {
  title: string;
  items: MenuItemDef[];
}

export interface AppMenuDef {
  /** Shown in bold immediately right of the Apple menu. */
  name: string;
  menus: MenuDef[];
}

const divider = (id: string): MenuItemDef => ({ id, divider: true });

/** Standard Edit menu. All of it is inert here, so all of it is greyed. */
const editMenu = (): MenuDef => ({
  title: "Edit",
  items: [
    { id: "undo", label: "Undo", shortcut: "⌘Z", disabled: true },
    { id: "redo", label: "Redo", shortcut: "⇧⌘Z", disabled: true },
    divider("d1"),
    { id: "cut", label: "Cut", shortcut: "⌘X", disabled: true },
    { id: "copy", label: "Copy", shortcut: "⌘C", disabled: true },
    { id: "paste", label: "Paste", shortcut: "⌘V", disabled: true },
    { id: "select-all", label: "Select All", shortcut: "⌘A", disabled: true },
  ],
});

const windowMenu = (): MenuDef => ({
  title: "Window",
  items: [
    { id: "minimize", label: "Minimize", shortcut: "⌘M", action: "minimize" },
    { id: "zoom", label: "Zoom", action: "zoom" },
    divider("d1"),
    { id: "bring-all", label: "Bring All to Front", disabled: true },
  ],
});

const helpMenu = (appName: string): MenuDef => ({
  title: "Help",
  items: [
    { id: "help", label: `${appName} Help`, shortcut: "⌘?", disabled: true },
    divider("d1"),
    { id: "contact", label: "Get in Touch…", action: "openContact" },
  ],
});

/** The app menu — the bold one carrying the app's own name. */
const appMenu = (appName: string, extra: MenuItemDef[] = []): MenuDef => ({
  title: appName,
  items: [
    { id: "about", label: "About This Mac", action: "about" },
    divider("d1"),
    { id: "settings", label: "Settings…", shortcut: "⌘,", action: "settings" },
    ...extra,
    divider("d2"),
    { id: "hide", label: `Hide ${appName}`, shortcut: "⌘H", action: "minimize" },
    { id: "quit", label: `Quit ${appName}`, shortcut: "⌘Q", action: "close" },
  ],
});

const fileMenu = (items: MenuItemDef[]): MenuDef => ({
  title: "File",
  items: [
    ...items,
    divider("d-close"),
    { id: "close", label: "Close Window", shortcut: "⌘W", action: "close" },
  ],
});

/**
 * What the menu bar shows for each window. macOS swaps the whole bar when you
 * focus a different app, which is the single loudest signal that this is a
 * desktop rather than a page.
 */
export const APP_MENUS: Record<WindowKey, AppMenuDef> = {
  finder: {
    name: "Portfolio",
    menus: [
      appMenu("Portfolio"),
      fileMenu([
        { id: "new", label: "New Finder Window", shortcut: "⌘N", action: "newFinder" },
        { id: "terminal", label: "Open Terminal", action: "openTerminal" },
      ]),
      editMenu(),
      {
        title: "View",
        items: [
          { id: "icons", label: "as Icons", shortcut: "⌘1", disabled: true },
          { id: "list", label: "as List", shortcut: "⌘2", disabled: true },
          divider("d1"),
          { id: "sidebar", label: "Hide Sidebar", shortcut: "⌥⌘S", disabled: true },
        ],
      },
      {
        title: "Go",
        items: [
          { id: "resume", label: "Resume", shortcut: "⇧⌘R", action: "openResume" },
          { id: "gallery", label: "Gallery", shortcut: "⇧⌘G", action: "openPhotos" },
          { id: "articles", label: "Articles", shortcut: "⇧⌘A", action: "openSafari" },
        ],
      },
      windowMenu(),
      helpMenu("Portfolio"),
    ],
  },

  safari: {
    name: "Articles",
    menus: [
      appMenu("Articles"),
      fileMenu([
        { id: "new-tab", label: "New Tab", shortcut: "⌘T", disabled: true },
      ]),
      editMenu(),
      {
        title: "View",
        items: [
          { id: "reload", label: "Reload Page", shortcut: "⌘R", disabled: true },
          { id: "reader", label: "Show Reader", shortcut: "⇧⌘R", disabled: true },
        ],
      },
      windowMenu(),
      helpMenu("Articles"),
    ],
  },

  photos: {
    name: "Gallery",
    menus: [
      appMenu("Gallery"),
      fileMenu([
        { id: "import", label: "Import…", shortcut: "⇧⌘I", disabled: true },
      ]),
      editMenu(),
      {
        title: "View",
        items: [
          { id: "zoom-in", label: "Zoom In", shortcut: "⌘+", disabled: true },
          { id: "zoom-out", label: "Zoom Out", shortcut: "⌘-", disabled: true },
        ],
      },
      windowMenu(),
      helpMenu("Gallery"),
    ],
  },

  terminal: {
    name: "Terminal",
    menus: [
      appMenu("Terminal"),
      fileMenu([
        { id: "new-window", label: "New Window", shortcut: "⌘N", action: "openTerminal" },
      ]),
      editMenu(),
      {
        title: "Shell",
        items: [
          { id: "clear", label: "Clear Buffer", shortcut: "⌘K", disabled: true },
          { id: "help", label: "Type 'help' for commands", disabled: true },
        ],
      },
      windowMenu(),
      helpMenu("Terminal"),
    ],
  },

  contact: {
    name: "Contact",
    menus: [
      appMenu("Contact"),
      fileMenu([]),
      editMenu(),
      windowMenu(),
      helpMenu("Contact"),
    ],
  },

  resume: {
    name: "Preview",
    menus: [
      appMenu("Preview"),
      fileMenu([
        { id: "download", label: "Export as PDF…", shortcut: "⌘S", action: "downloadResume" },
      ]),
      editMenu(),
      windowMenu(),
      helpMenu("Preview"),
    ],
  },

  txtfile: {
    name: "TextEdit",
    menus: [
      appMenu("TextEdit"),
      fileMenu([]),
      editMenu(),
      windowMenu(),
      helpMenu("TextEdit"),
    ],
  },

  imgfile: {
    name: "Preview",
    menus: [
      appMenu("Preview"),
      fileMenu([]),
      editMenu(),
      windowMenu(),
      helpMenu("Preview"),
    ],
  },

  settings: {
    name: "System Settings",
    menus: [
      appMenu("System Settings"),
      fileMenu([]),
      editMenu(),
      {
        title: "View",
        items: [
          { id: "theme", label: "Toggle Appearance", action: "toggleTheme" },
        ],
      },
      windowMenu(),
      helpMenu("System Settings"),
    ],
  },

  about: {
    name: "Portfolio",
    menus: [
      appMenu("Portfolio"),
      fileMenu([]),
      editMenu(),
      windowMenu(),
      helpMenu("Portfolio"),
    ],
  },
};

/** Shown when nothing is open, exactly as macOS falls back to the Finder. */
export const DEFAULT_APP_MENU: AppMenuDef = {
  name: "Finder",
  menus: [
    {
      title: "Finder",
      items: [
        { id: "about", label: "About This Mac", action: "about" },
        divider("d1"),
        { id: "settings", label: "Settings…", shortcut: "⌘,", action: "settings" },
        divider("d2"),
        { id: "restart", label: "Restart…", action: "restart" },
      ],
    },
    {
      title: "File",
      items: [
        { id: "new", label: "New Finder Window", shortcut: "⌘N", action: "newFinder" },
        { id: "terminal", label: "Open Terminal", action: "openTerminal" },
      ],
    },
    {
      title: "Go",
      items: [
        { id: "resume", label: "Resume", shortcut: "⇧⌘R", action: "openResume" },
        { id: "gallery", label: "Gallery", shortcut: "⇧⌘G", action: "openPhotos" },
        { id: "articles", label: "Articles", shortcut: "⇧⌘A", action: "openSafari" },
      ],
    },
    helpMenu("Finder"),
  ],
};
