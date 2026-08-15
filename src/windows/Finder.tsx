import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { Columns3, LayoutGrid, List, Search } from "lucide-react";
import clsx from "clsx";

import { WindowControls } from "#components";
import ItemIcon from "#components/ItemIcon";
import WindowWrapper from "#hoc/WindowWrapper";
import { locations } from "#constants/index";
import useLocationStore from "#store/location";
import useWindowStore from "#store/window";
import useQuickLookStore from "#store/quicklook";
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

  /*
   * Quick Look previews whatever is selected, and focus is what selection is
   * here. macOS selects on a single click and opens on a double; this desktop
   * opens on the first click, because a visitor clicking a project once should
   * see the project. Rather than change that, the thing the keyboard is aimed
   * at is treated as the thing that is selected — which every item already
   * publishes, being a button or a focusable row.
   */
  const quickLook = (item: FinderItem) => useQuickLookStore.getState().toggle(item);

  /**
   * Space previews, as it does in the Finder. It has to be taken before the
   * browser sees it: on a focused button Space is a click, so without this the
   * item would open rather than be previewed — and on the list's rows it would
   * scroll the pane out from under the selection.
   */
  const handleItemKeyDown = (e: KeyboardEvent, item: FinderItem) => {
    if (e.key !== " ") return;
    e.preventDefault();
    quickLook(item);
  };

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
          <li key={item.id}>
            {/*
              A real button inside the <li>, as on the desktop icons: the row
              was a bare <li> and so reachable only by pointer. The <li> keeps
              the list semantics and nothing else — every style sits on the
              button, which is what the visitor is actually pointing at.
            */}
            <button
              type="button"
              onClick={() => setActiveLocation(item)}
              aria-current={item.id === activeLocation?.id ? "true" : undefined}
              className={clsx(
                item.id === activeLocation?.id ? "active" : "not-active",
              )}
            >
              {/* The masked glyphs stay a bare <img>: ItemIcon exists to tint
                  and badge folder art, and there is neither to do to a
                  silhouette already being repainted in the accent colour. */}
              {accented ? (
                <img
                  src={item.icon}
                  className="w-4 accent-glyph"
                  style={{ "--icon": `url(${item.icon})` } as CSSProperties}
                  // The name is in the <p> beside it; repeating it here would
                  // have a screen reader read every row twice
                  alt=""
                />
              ) : (
                <ItemIcon item={item} />
              )}
              <p className="text-sm font-medium truncate">{item.name}</p>
            </button>
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
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    onKeyDown={(e) => handleItemKeyDown(e, item)}
                  >
                    <ItemIcon item={item} />
                    <p>{item.name}</p>
                  </button>
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
                    /*
                      The row itself takes focus, rather than a button inside
                      it. A button cannot wrap two cells, and putting one in
                      the Name cell alone would leave the keyboard aiming at
                      something narrower than what the pointer clicks.
                    */
                    <tr
                      key={item.id}
                      tabIndex={0}
                      onClick={() => openItem(item)}
                      onKeyDown={(e) => {
                        // Enter opens and Space previews, which is the split
                        // macOS makes. Both are taken from the browser: Space
                        // would otherwise scroll the pane out from under the row.
                        if (e.key === " ") return handleItemKeyDown(e, item);
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        openItem(item);
                      }}
                    >
                      {/* The flex box is inside the cell, not the cell itself:
                        display:flex on a <td> drops it out of the table
                        layout and the columns stop lining up */}
                      <td>
                        <span className="name">
                          <ItemIcon item={item} />
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
                  <li key={item.id}>
                    <button
                      type="button"
                      className={clsx(item.id === drilled?.id && "selected")}
                      onClick={() => selectInColumn(item)}
                      onKeyDown={(e) => handleItemKeyDown(e, item)}
                      // A folder here opens the next column rather than
                      // navigating, which is exactly what expanded describes
                      aria-expanded={
                        item.kind === "folder"
                          ? item.id === drilled?.id
                          : undefined
                      }
                    >
                      <ItemIcon item={item} />
                      <span className="truncate">{item.name}</span>
                      {item.kind === "folder" && (
                        <span className="chevron">›</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {/* The second column only exists once a folder is chosen, which
                  is how macOS reveals depth one step at a time */}
              {drilled && (
                <ul>
                  {(drilled.children ?? []).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        onKeyDown={(e) => handleItemKeyDown(e, item)}
                      >
                        <ItemIcon item={item} />
                        <span className="truncate">{item.name}</span>
                      </button>
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
                <ItemIcon item={activeLocation} />
                <span>{activeLocation.name}</span>
              </>
            )}
            {drilled && view === "column" && (
              <>
                <span className="sep">›</span>
                <ItemIcon item={drilled} />
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
