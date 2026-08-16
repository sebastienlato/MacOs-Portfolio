import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import ItemIcon from "#components/ItemIcon";
import { blogPosts, locations } from "#constants/index";
import { GRID_APPS, DOCK_APPS, HOME_LINKS } from "#mobile/constants";
import type { MobileAppId } from "#mobile/constants";
import useMobileStore from "#mobile/store";
import type { FinderItem } from "#types";

interface Hit {
  id: string;
  title: string;
  category: string;
  /*
   * Three ways a hit can be drawn, because there are three kinds of thing in
   * here: artwork with a path, a Finder item that ItemIcon tints and badges,
   * and the apps that ship no art at all and wear a glyph on a tinted tile.
   * The last is not optional — Resume, About and Settings are all glyph apps,
   * and an <img> with no src renders as a broken-image box.
   */
  icon?: string;
  item?: FinderItem;
  Glyph?: LucideIcon;
  tint?: string;
  haystack: string;
  run: () => void;
}

/**
 * Search, which the desktop has had as Spotlight and the phone had not at all.
 *
 * iOS puts it behind the pill above the dock, so that is where it lives. The
 * index is the same content the desktop's Spotlight walks — apps, projects, the
 * files inside them, posts, links — because a visitor on a phone is looking for
 * exactly the same things.
 */
const SearchSheet = ({ close }: { close: () => void }) => {
  const openApp = useMobileStore((state) => state.openApp);
  const [query, setQuery] = useState("");

  const index = useMemo<Hit[]>(() => {
    const hits: Hit[] = [];
    const open = (id: MobileAppId, path?: FinderItem[]) => () => {
      close();
      openApp(id, path ? { path } : undefined);
    };

    for (const app of [...DOCK_APPS, ...GRID_APPS]) {
      hits.push({
        id: `app-${app.id}`,
        title: app.name,
        category: "App",
        icon: app.icon,
        Glyph: app.Glyph,
        tint: app.tint,
        haystack: `${app.name} ${app.title}`.toLowerCase(),
        run: open(app.id),
      });
    }

    for (const project of locations.work.children ?? []) {
      hits.push({
        id: `project-${project.id}`,
        title: project.name,
        category: "Project",
        item: project,
        haystack: project.name.toLowerCase(),
        run: open("files", [locations.work, project]),
      });

      for (const file of project.children ?? []) {
        hits.push({
          id: `file-${project.id}-${file.id}`,
          title: file.name,
          category: project.name,
          item: file,
          haystack: [file.name, ...(file.description ?? [])]
            .join(" ")
            .toLowerCase(),
          run: open("files", [locations.work, project]),
        });
      }
    }

    for (const post of blogPosts) {
      hits.push({
        id: `post-${post.id}`,
        title: post.title,
        category: "Article",
        icon: "/images/safari.webp",
        haystack: post.title.toLowerCase(),
        run: () => {
          close();
          window.open(post.link, "_blank", "noopener,noreferrer");
        },
      });
    }

    for (const link of HOME_LINKS) {
      hits.push({
        id: `link-${link.id}`,
        title: link.name,
        category: "Link",
        icon: link.icon,
        haystack: `${link.name} ${link.href}`.toLowerCase(),
        run: () => {
          close();
          window.open(link.href, "_blank", "noopener,noreferrer");
        },
      });
    }

    return hits;
  }, [close, openApp]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.filter((hit) => hit.category === "App");

    return index
      .map((hit) => {
        const title = hit.title.toLowerCase();
        let score = 0;
        if (title.startsWith(q)) score = 3;
        else if (title.includes(q)) score = 2;
        else if (hit.haystack.includes(q)) score = 1;
        return { hit, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ hit }) => hit);
  }, [index, query]);

  return (
    <div className="search-sheet" role="dialog" aria-modal="true" aria-label="Search">
      <div className="sheet-bar">
        <span className="field">
          <Search size={16} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search"
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="search"
          />
        </span>
        <button type="button" onClick={close} aria-label="Cancel search">
          <X size={18} />
        </button>
      </div>

      {results.length > 0 ? (
        <ul className="sheet-results">
          {results.map((hit) => (
            <li key={hit.id}>
              <button type="button" onClick={hit.run}>
                {hit.item ? (
                  <ItemIcon item={hit.item} />
                ) : hit.icon ? (
                  <img src={hit.icon} alt="" />
                ) : (
                  <span className="glyph-tile" style={{ background: hit.tint }}>
                    {hit.Glyph && <hit.Glyph size={17} />}
                  </span>
                )}
                <span className="labels">
                  <span className="title truncate">{hit.title}</span>
                  <span className="cat">{hit.category}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        /* Announced, since the only sign of it is the list disappearing */
        <p className="sheet-empty" role="status">
          No results for “{query}”
        </p>
      )}
    </div>
  );
};

export default SearchSheet;
