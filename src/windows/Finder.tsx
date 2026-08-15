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
import useInfoStore from "#store/info";
import ContextMenu, { type ContextMenuItem } from "#components/ContextMenu";
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
   * Selection, as the Finder has it: one click selects and two open.
   *
   * This used to open on the first click, and the trade is real — a visitor
   * reaching a project now spends a click getting there. What buys it back is
   * that selection is what Quick Look runs on, and spacebar preview is only
   * worth having if a pointer can reach it: before this it was a keyboard
   * gesture in a Finder nobody tabs through.
   *
   * Focus sets it too, so the keyboard and the pointer never disagree about
   * what is selected — tabbing to an item selects it, exactly as arrowing onto
   * one does in the real thing.
   */
  const [selected, setSelected] = useState<FinderItem | null>(null);

  // Moving to another folder invalidates the selection along with the column
  if (drilledFrom !== activeLocation?.id && selected) setSelected(null);

  const quickLook = (item: FinderItem) => useQuickLookStore.getState().toggle(item);

  /**
   * Space previews and Enter opens, which is the split macOS makes.
   *
   * Both have to be taken before the browser sees them. On a focused button
   * Enter and Space are both a click, and a click now selects — so without
   * this, Enter would re-select the thing it is meant to open and Space would
   * scroll the pane out from under it.
   */
  const handleItemKeyDown = (e: KeyboardEvent, item: FinderItem) => {
    if (e.key === " ") {
      e.preventDefault();
      quickLook(item);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      openItem(item);
    }
  };

  /** One click selects. The open is on the second — see `onDoubleClick`. */
  const selectItem = (item: FinderItem) => setSelected(item);

  /* Clicking the empty part of a view drops the selection, as the Finder does.
     Guarded on the target being the container itself, or every click on an
     item would bubble up and immediately clear what it just selected. */
  const clearOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setSelected(null);
  };

  const isSelected = (item: FinderItem) => selected?.id === item.id;

  /*
   * The right-click menu, as macOS gives every Finder item. The desktop's own
   * handler already steps aside for anything inside a window, so this does not
   * have to fight it — see the guard in DesktopMenu.
   */
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    item: FinderItem;
  } | null>(null);

  const menuItems = (item: FinderItem): ContextMenuItem[] => [
    { id: "open", label: "Open", onSelect: () => openItem(item) },
    {
      id: "quick-look",
      label: `Quick Look "${item.name}"`,
      onSelect: () => useQuickLookStore.getState().open(item),
    },
    { id: "d1", divider: true },
    {
      id: "info",
      label: "Get Info",
      // Only a folder has a colour and a badge to change
      disabled: item.kind !== "folder",
      onSelect: () => useInfoStore.getState().open(item),
    },
  ];

  const openMenu = (e: React.MouseEvent, item: FinderItem) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, item });
  };

  const openItem = (item: FinderItem) => {
    if (item.fileType === "pdf") return openWindow("resume");
    if (item.kind === "folder") return setActiveLocation(item);
    if ((item.fileType === "fig" || item.fileType === "url") && item.href)
      return window.open(item.href, "_blank");

    if (item.fileType === "txt") return openWindow("txtfile", item);
    if (item.fileType === "img") return openWindow("imgfile", item);
  };

  /**
   * In column view a folder expands the next column instead of navigating,
   * which is the one place a single click still does something beyond
   * selecting — that is what a column view is for. A file only selects; the
   * double click opens it, as everywhere else.
   */
  const selectInColumn = (item: FinderItem) => {
    setSelected(item);
    if (item.kind === "folder") setDrilled(item);
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
              /* Only where a look could actually be seen. The Favorites rows
                 are masked accent glyphs rather than folder art, so a colour
                 and a badge have nowhere to land on them — offering Get Info
                 there saves a change the row you right-clicked cannot show. */
              onContextMenu={accented ? undefined : (e) => openMenu(e, item)}
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
            <ul className="icon-view" onClick={clearOnBackdrop}>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={clsx(isSelected(item) && "selected")}
                    aria-pressed={isSelected(item)}
                    onClick={() => selectItem(item)}
                    onDoubleClick={() => openItem(item)}
                    onFocus={() => selectItem(item)}
                    onKeyDown={(e) => handleItemKeyDown(e, item)}
                    onContextMenu={(e) => openMenu(e, item)}
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
                      className={clsx(isSelected(item) && "selected")}
                      aria-selected={isSelected(item)}
                      onClick={() => selectItem(item)}
                      onDoubleClick={() => openItem(item)}
                      onFocus={() => selectItem(item)}
                      onContextMenu={(e) => openMenu(e, item)}
                      onKeyDown={(e) => handleItemKeyDown(e, item)}
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
                      className={clsx(
                        (item.id === drilled?.id || isSelected(item)) &&
                          "selected"
                      )}
                      onClick={() => selectInColumn(item)}
                      onDoubleClick={() => openItem(item)}
                      onFocus={() => selectItem(item)}
                      onKeyDown={(e) => handleItemKeyDown(e, item)}
                      onContextMenu={(e) => openMenu(e, item)}
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
                        className={clsx(isSelected(item) && "selected")}
                        onClick={() => selectItem(item)}
                        onDoubleClick={() => openItem(item)}
                        onFocus={() => selectItem(item)}
                        onKeyDown={(e) => handleItemKeyDown(e, item)}
                        onContextMenu={(e) => openMenu(e, item)}
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

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.item)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
};

const FinderWindow = WindowWrapper(Finder, "finder");

export default FinderWindow;
