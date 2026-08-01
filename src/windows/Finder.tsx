import { useState, type CSSProperties } from "react";
import { Columns3, LayoutGrid, List, Search } from "lucide-react";
import clsx from "clsx";

import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";
import { locations } from "#constants/index";
import useLocationStore from "#store/location";
import useWindowStore from "#store/window";
import type { FinderItem } from "#types";

type ViewMode = "icon" | "list" | "column";

const VIEWS: { mode: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { mode: "icon", label: "as Icons", Icon: LayoutGrid },
  { mode: "list", label: "as List", Icon: List },
  { mode: "column", label: "as Columns", Icon: Columns3 },
];

/** What the Kind column says, from the little the data actually knows. */
const kindOf = (item: FinderItem) => {
  if (item.kind === "folder") return "Folder";
  const kinds: Record<string, string> = {
    txt: "Plain Text",
    url: "Web Link",
    img: "Image",
    fig: "Figma",
    pdf: "PDF Document",
  };
  return kinds[item.fileType ?? ""] ?? "Document";
};

const Finder = () => {
  const { openWindow } = useWindowStore();
  const { activeLocation, setActiveLocation, trashItems } = useLocationStore();
  const [view, setView] = useState<ViewMode>("icon");
  /** Column view only: the folder whose contents fill the second column. */
  const [drilled, setDrilled] = useState<FinderItem | null>(null);
  const [drilledFrom, setDrilledFrom] = useState(activeLocation?.id);

  // Moving to another location invalidates the column selection. Adjusted
  // during render rather than in an effect, so the stale column never paints.
  if (drilledFrom !== activeLocation?.id) {
    setDrilledFrom(activeLocation?.id);
    setDrilled(null);
  }

  // Trash is the one folder that can be emptied, so its contents come from the
  // store rather than from the static location tree.
  const items =
    activeLocation?.type === "trash"
      ? trashItems
      : (activeLocation?.children ?? []);

  const openItem = (item: FinderItem) => {
    if (item.fileType === "pdf") return openWindow("resume");
    if (item.kind === "folder") return setActiveLocation(item);
    if ((item.fileType === "fig" || item.fileType === "url") && item.href)
      return window.open(item.href, "_blank");

    if (item.fileType === "txt") return openWindow("txtfile", item);
    if (item.fileType === "img") return openWindow("imgfile", item);
  };

  /** In column view a folder expands the next column instead of navigating. */
  const selectInColumn = (item: FinderItem) => {
    if (item.kind === "folder") return setDrilled(item);
    openItem(item);
  };

  /**
   * `accented` marks a list whose glyphs are flat monochrome SVGs, which lets
   * CSS mask them and paint them in the accent colour. The project list below
   * is full-colour folder art, and masking that would flatten it to a blob.
   */
  const renderSidebarList = (
    name: string,
    entries: FinderItem[],
    accented = false
  ) => (
    <div>
      <h3>{name}</h3>

      <ul>
        {entries.map((item) => (
          <li
            key={item.id}
            onClick={() => setActiveLocation(item)}
            className={clsx(
              item.id === activeLocation?.id ? "active" : "not-active",
            )}
          >
            <img
              src={item.icon}
              className={clsx("w-4", accented && "accent-glyph")}
              style={
                accented
                  ? ({ "--icon": `url(${item.icon})` } as CSSProperties)
                  : undefined
              }
              alt={item.name}
            />
            <p className="text-sm font-medium truncate">{item.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <div id="window-header">
        <WindowControls target="finder" />

        {/* Segmented control, as macOS puts the view switcher in the toolbar */}
        <div className="view-switcher" role="group" aria-label="View options">
          {VIEWS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              className={clsx(view === mode && "selected")}
              aria-label={label}
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <Search className="icon" />
      </div>

      <div className="flex h-full min-h-0">
        <div className="sidebar">
          {renderSidebarList("Favorites", Object.values(locations), true)}
          {renderSidebarList("My Projects", locations.work.children ?? [])}
        </div>

        <div className="content">
          {view === "icon" && (
            <ul className="icon-view">
              {items.map((item) => (
                <li key={item.id} onClick={() => openItem(item)}>
                  <img src={item.icon} alt={item.name} />
                  <p>{item.name}</p>
                </li>
              ))}
            </ul>
          )}

          {view === "list" && (
            <div className="list-view">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Kind</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => openItem(item)}>
                      {/* The flex box is inside the cell, not the cell itself:
                        display:flex on a <td> drops it out of the table
                        layout and the columns stop lining up */}
                      <td>
                        <span className="name">
                          <img src={item.icon} alt="" />
                          <span className="truncate">{item.name}</span>
                        </span>
                      </td>
                      <td className="kind">{kindOf(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "column" && (
            <div className="column-view">
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={clsx(item.id === drilled?.id && "selected")}
                    onClick={() => selectInColumn(item)}
                  >
                    <img src={item.icon} alt="" />
                    <span className="truncate">{item.name}</span>
                    {item.kind === "folder" && (
                      <span className="chevron">›</span>
                    )}
                  </li>
                ))}
              </ul>

              {/* The second column only exists once a folder is chosen, which
                  is how macOS reveals depth one step at a time */}
              {drilled && (
                <ul>
                  {(drilled.children ?? []).map((item) => (
                    <li key={item.id} onClick={() => openItem(item)}>
                      <img src={item.icon} alt="" />
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Path bar, pinned to the bottom as in macOS */}
          <div className="path-bar">
            {activeLocation && (
              <>
                <img src={activeLocation.icon} alt="" />
                <span>{activeLocation.name}</span>
              </>
            )}
            {drilled && view === "column" && (
              <>
                <span className="sep">›</span>
                <img src={drilled.icon} alt="" />
                <span>{drilled.name}</span>
              </>
            )}
            <span className="count">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

const FinderWindow = WindowWrapper(Finder, "finder");

export default FinderWindow;
