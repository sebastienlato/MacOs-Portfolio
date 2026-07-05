import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { blogPosts, locations, socials } from "#constants/index";
import useSystemStore from "#store/system";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import type { FinderItem, WindowKey, WindowState } from "#types";

interface SpotlightItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  /** Lowercased text this item can be found by. */
  haystack: string;
  action: () => void;
}

const APPS: { title: string; key: WindowKey; icon: string; extra?: string }[] =
  [
    { title: "Portfolio", key: "finder", icon: "/images/finder.png", extra: "finder projects work" },
    { title: "Articles", key: "safari", icon: "/images/safari.png", extra: "safari blog browser" },
    { title: "Gallery", key: "photos", icon: "/images/photos.png", extra: "photos pictures" },
    { title: "Contact", key: "contact", icon: "/images/contact.png", extra: "email socials" },
    { title: "Terminal", key: "terminal", icon: "/images/terminal.png", extra: "shell zsh commands" },
    { title: "Resume", key: "resume", icon: "/images/pdf.png", extra: "cv pdf" },
    { title: "System Settings", key: "settings", icon: "/images/wallpaper.png", extra: "wallpaper preferences" },
    { title: "About This Mac", key: "about", icon: "/macbook.png", extra: "specs info" },
  ];

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable);

const closeTopMostWindow = () => {
  const { windows, closeWindow } = useWindowStore.getState();
  const open = (Object.entries(windows) as [WindowKey, WindowState][])
    .filter(([, win]) => win.isOpen && !win.isMinimized)
    .sort(([, a], [, b]) => b.zIndex - a.zIndex);
  if (open.length > 0) closeWindow(open[0][0]);
};

const Spotlight = () => {
  const { spotlightOpen, setSpotlightOpen } = useSystemStore();

  // Global shortcuts: ⌘K / Ctrl+K / ⌘Space toggle, Esc closes (window as fallback)
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      const { spotlightOpen: open, toggleSpotlight, setSpotlightOpen: setOpen } =
        useSystemStore.getState();

      if (cmd && (e.key.toLowerCase() === "k" || e.code === "Space")) {
        e.preventDefault();
        toggleSpotlight();
        return;
      }

      if (e.key === "Escape") {
        if (open) {
          setOpen(false);
        } else if (!isEditable(e.target)) {
          closeTopMostWindow();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!spotlightOpen) return null;

  // Mounted fresh on every open, so query/selection state starts clean
  return <SpotlightPanel close={() => setSpotlightOpen(false)} />;
};

const SpotlightPanel = ({ close }: { close: () => void }) => {
  const { openWindow } = useWindowStore();
  const { setActiveLocation } = useLocationStore();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const index = useMemo<SpotlightItem[]>(() => {
    const items: SpotlightItem[] = [];

    const fileHaystack = (item: FinderItem) =>
      [item.name, item.subtitle, ...(item.description ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const openFile = (item: FinderItem, parent?: FinderItem) => {
      if (item.fileType === "pdf") return openWindow("resume");
      if ((item.fileType === "url" || item.fileType === "fig") && item.href)
        return window.open(item.href, "_blank");
      if (item.fileType === "txt") return openWindow("txtfile", item);
      if (item.fileType === "img") return openWindow("imgfile", item);
      if (parent) {
        setActiveLocation(parent);
        openWindow("finder");
      }
    };

    for (const app of APPS) {
      items.push({
        id: `app-${app.key}-${app.title}`,
        title: app.title,
        category: "Application",
        icon: app.icon,
        haystack: `${app.title} ${app.extra ?? ""}`.toLowerCase(),
        action: () => openWindow(app.key),
      });
    }

    items.push({
      id: "app-trash",
      title: "Trash",
      category: "Application",
      icon: "/images/trash.png",
      haystack: "trash bin archive",
      action: () => {
        setActiveLocation(locations.trash);
        openWindow("finder");
      },
    });

    for (const project of locations.work.children ?? []) {
      items.push({
        id: `project-${project.id}-${project.name}`,
        title: project.name,
        category: "Project",
        icon: "/images/folder.png",
        haystack: [
          project.name,
          ...(project.children ?? []).map(fileHaystack),
        ]
          .join(" ")
          .toLowerCase(),
        action: () => {
          setActiveLocation(project);
          openWindow("finder");
        },
      });

      for (const file of project.children ?? []) {
        items.push({
          id: `file-${project.id}-${file.id}-${file.name}`,
          title: file.name,
          category: `File — ${project.name}`,
          icon: file.icon,
          haystack: fileHaystack(file),
          action: () => openFile(file, project),
        });
      }
    }

    for (const file of locations.about.children ?? []) {
      items.push({
        id: `about-${file.id}-${file.name}`,
        title: file.name,
        category: "File — About me",
        icon: file.icon,
        haystack: fileHaystack(file),
        action: () => openFile(file, locations.about),
      });
    }

    for (const post of blogPosts) {
      items.push({
        id: `blog-${post.id}`,
        title: post.title,
        category: "Blog Post",
        icon: "/images/safari.png",
        haystack: post.title.toLowerCase(),
        action: () => window.open(post.link, "_blank"),
      });
    }

    for (const social of socials) {
      items.push({
        id: `social-${social.id}`,
        title: social.text,
        category: "Link",
        icon: social.icon,
        haystack: `${social.text} ${social.link}`.toLowerCase(),
        action: () => window.open(social.link, "_blank"),
      });
    }

    return items;
  }, [openWindow, setActiveLocation]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.filter((item) => item.category === "Application");

    return index
      .map((item) => {
        const title = item.title.toLowerCase();
        let score = 0;
        if (title.startsWith(q)) score = 3;
        else if (title.includes(q)) score = 2;
        else if (item.haystack.includes(q)) score = 1;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ item }) => item);
  }, [index, query]);

  useGSAP(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.fromTo(
      panel,
      { opacity: 0, scale: 0.97, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power2.out" }
    );
  }, []);

  const run = (item: SpotlightItem) => {
    close();
    item.action();
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      run(results[selected]);
    }
  };

  return (
    <div id="spotlight" onMouseDown={close}>
      <div
        ref={panelRef}
        className="panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="search-row">
          <Search size={22} />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Spotlight Search"
            spellCheck={false}
            autoComplete="off"
            aria-label="Spotlight search"
          />
          <kbd>⌘K</kbd>
        </div>

        {results.length > 0 ? (
          <ul className="results">
            {results.map((item, i) => (
              <li
                key={item.id}
                className={clsx(i === selected && "selected")}
                onMouseEnter={() => setSelected(i)}
                onClick={() => run(item)}
              >
                <img src={item.icon} alt="" />
                <p>{item.title}</p>
                <span className="category">{item.category}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No results for “{query}”</p>
        )}
      </div>
    </div>
  );
};

export default Spotlight;
