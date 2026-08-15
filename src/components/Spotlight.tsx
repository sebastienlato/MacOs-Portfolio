import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Copy,
  Download,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Mail,
  Moon,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { blogPosts, contactEmail, locations, socials } from "#constants/index";
import useSystemStore from "#store/system";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import { seconds } from "#utils/motion";
import ItemIcon from "#components/ItemIcon";
import { copyText } from "#utils/clipboard";
import type { FinderItem, WindowKey } from "#types";

/** The label an action carries, and what every other result is measured against. */
const ACTION = "Action";

interface SpotlightItem {
  id: string;
  title: string;
  category: string;
  /**
   * A path for the things that ship artwork, a node for the things that don't.
   * Actions are drawn rather than photographed — a glyph in a tinted tile is
   * what separates "do this" from "open this" at a glance.
   */
  icon: string | ReactNode;
  /** Lowercased text this item can be found by. */
  haystack: string;
  action: () => void;
  /**
   * macOS 26's Quick Keys: type these two letters and nothing else, and this
   * is the top hit. Actions only — an app is already found by its name.
   */
  quickKey?: string;
}

const APPS: { title: string; key: WindowKey; icon: string; extra?: string }[] =
  [
    { title: "Portfolio", key: "finder", icon: "/images/finder.png", extra: "finder projects work" },
    { title: "Articles", key: "safari", icon: "/images/safari.png", extra: "safari blog browser" },
    { title: "Gallery", key: "photos", icon: "/images/photos.png", extra: "photos pictures" },
    { title: "Contact", key: "contact", icon: "/images/contact.png", extra: "email socials" },
    { title: "Terminal", key: "terminal", icon: "/images/terminal.png", extra: "shell zsh commands" },
    { title: "Resume", key: "resume", icon: "/images/pdf.png", extra: "cv pdf" },
    { title: "System Settings", key: "settings", icon: "/images/wallpaper.webp", extra: "wallpaper preferences" },
    { title: "About This Mac", key: "about", icon: "/macbook.png", extra: "specs info" },
  ];

const Spotlight = () => {
  const { spotlightOpen, setSpotlightOpen } = useSystemStore();

  // ⌘K / ⌘Space and Escape now live in KeyboardShortcuts, alongside the rest

  if (!spotlightOpen) return null;

  // Mounted fresh on every open, so query/selection state starts clean
  return <SpotlightPanel close={() => setSpotlightOpen(false)} />;
};

const SpotlightPanel = ({ close }: { close: () => void }) => {
  const { openWindow, toggleMissionControl } = useWindowStore();
  const { setActiveLocation, trashItems, emptyTrash } = useLocationStore();
  const { theme, toggleTheme } = useSystemStore();

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
      icon: "/images/trash.webp",
      haystack: "trash bin archive",
      action: () => {
        setActiveLocation(locations.trash);
        openWindow("finder");
      },
    });

    /*
     * Actions — the half of Spotlight that does something rather than opening
     * something, and the thing 26 rebuilt it around. A portfolio turns out to
     * be an unusually good fit for them: what a visitor actually wants here is
     * a verb, and the alternative is making them find the Contact window and
     * select an address out of it by hand.
     *
     * All of them are silent when they land, which is what macOS does. Saying
     * "copied" would need somewhere to say it, and this desktop has no such
     * surface — see the note by the Quick Keys.
     */
    items.push(
      {
        id: "action-email",
        title: "Email Sebastien",
        category: ACTION,
        icon: <Mail size={15} />,
        haystack: `email mail contact write hire ${contactEmail}`.toLowerCase(),
        quickKey: "em",
        // `assign` rather than setting `location.href`, which the immutability
        // rule reads as a write to a value it is guarding
        action: () => window.location.assign(`mailto:${contactEmail}`),
      },
      {
        id: "action-copy-email",
        title: "Copy Email Address",
        category: ACTION,
        icon: <Copy size={15} />,
        haystack: `copy email address clipboard ${contactEmail}`.toLowerCase(),
        quickKey: "ce",
        action: () => void copyText(contactEmail),
      },
      {
        id: "action-resume",
        title: "Download Résumé",
        category: ACTION,
        icon: <Download size={15} />,
        haystack: "download resume résumé cv pdf",
        quickKey: "dr",
        action: () => {
          const link = document.createElement("a");
          link.href = "files/resume.pdf";
          link.download = "resume.pdf";
          link.click();
        },
      },
      {
        /*
         * Worth having because the desktop is addressable: the hash already
         * tracks whatever is frontmost, so this copies a link that reopens the
         * view being looked at rather than the bare desktop.
         */
        id: "action-copy-link",
        title: "Copy Link to This View",
        category: ACTION,
        icon: <Link2 size={15} />,
        haystack: "copy link url share address permalink",
        quickKey: "cl",
        action: () => void copyText(window.location.href),
      },
      {
        id: "action-appearance",
        title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Appearance`,
        category: ACTION,
        icon: theme === "dark" ? <Sun size={15} /> : <Moon size={15} />,
        haystack: "appearance theme dark light mode switch toggle",
        quickKey: theme === "dark" ? "la" : "da",
        action: toggleTheme,
      },
      {
        id: "action-wallpaper",
        title: "Change Wallpaper",
        category: ACTION,
        icon: <ImageIcon size={15} />,
        haystack: "change wallpaper desktop background picture",
        quickKey: "cw",
        action: () => openWindow("settings"),
      },
      {
        id: "action-mission-control",
        title: "Mission Control",
        category: ACTION,
        icon: <LayoutGrid size={15} />,
        haystack: "mission control windows spaces overview expose",
        quickKey: "mc",
        action: toggleMissionControl,
      }
    );

    // Offered only when there is something to empty, as the real menu item is
    if (trashItems.length > 0) {
      items.push({
        id: "action-empty-trash",
        title: "Empty Trash",
        category: ACTION,
        icon: <Trash2 size={15} />,
        haystack: "empty trash bin delete clear",
        quickKey: "et",
        action: emptyTrash,
      });
    }

    for (const project of locations.work.children ?? []) {
      items.push({
        id: `project-${project.id}-${project.name}`,
        title: project.name,
        category: "Project",
        // Tinted and badged here too, or a folder that is purple in the Finder
        // would turn up plain blue the moment it is searched for
        icon: <ItemIcon item={project} />,
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
  }, [
    openWindow,
    setActiveLocation,
    toggleMissionControl,
    trashItems,
    emptyTrash,
    theme,
    toggleTheme,
  ]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    /*
     * The resting list is what you can open and what you can do, which is the
     * whole point of putting actions in: nobody discovers a verb they have to
     * guess the name of first. Everything else waits to be searched for.
     */
    if (!q)
      return index.filter(
        (item) => item.category === "Application" || item.category === ACTION
      );

    return index
      .map((item) => {
        const title = item.title.toLowerCase();
        let score = 0;
        // A quick key is typed in full and means exactly one thing, so it
        // outranks even a title that starts with the same letters
        if (item.quickKey === q) score = 4;
        else if (title.startsWith(q)) score = 3;
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
      { opacity: 1, scale: 1, y: 0, duration: seconds(0.18), ease: "power2.out" }
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
    <div
      id="spotlight"
      onMouseDown={close}
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight Search"
    >
      <div
        ref={panelRef}
        className="panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="search-row">
          <Search size={22} aria-hidden="true" />
          {/*
            A combobox driving a listbox: the arrow keys move `selected`, which
            is published through aria-activedescendant so a screen reader reads
            each result as it is highlighted. Focus itself never leaves the
            input, which is what keeps typing and choosing in one place.
          */}
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
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="spotlight-results"
            aria-autocomplete="list"
            aria-activedescendant={results[selected]?.id}
          />
          <kbd>⌘K</kbd>
        </div>

        {results.length > 0 ? (
          <ul className="results" id="spotlight-results" role="listbox">
            {results.map((item, i) => (
              <li
                key={item.id}
                id={item.id}
                role="option"
                aria-selected={i === selected}
                className={clsx(i === selected && "selected")}
                onMouseEnter={() => setSelected(i)}
                onClick={() => run(item)}
              >
                {typeof item.icon === "string" ? (
                  <img src={item.icon} alt="" />
                ) : (
                  <span className="action-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <p>{item.title}</p>
                <span className="category">{item.category}</span>
                {/* Printed rather than hidden, because a shortcut nobody has
                    been shown is a shortcut nobody uses */}
                {item.quickKey && <kbd className="quick-key">{item.quickKey}</kbd>}
              </li>
            ))}
          </ul>
        ) : (
          /* Announced, since the only sign of it is text appearing */
          <p className="empty" role="status">
            No results for “{query}”
          </p>
        )}
      </div>
    </div>
  );
};

export default Spotlight;
