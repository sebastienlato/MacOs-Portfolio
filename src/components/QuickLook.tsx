import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import ItemIcon from "#components/ItemIcon";
import useQuickLookStore from "#store/quicklook";
import useLocationStore from "#store/location";
import useWindowStore from "#store/window";
import { seconds } from "#utils/motion";
import type { FinderItem } from "#types";

/** What the button in the corner offers to do with this kind of thing. */
const openLabel = (item: FinderItem) => {
  if (item.kind === "folder") return "Open in Finder";
  if (item.fileType === "pdf") return "Open in Preview";
  if (item.fileType === "url" || item.fileType === "fig") return "Open Link";
  return "Open";
};

/**
 * The preview itself, which is the only part that varies by kind.
 *
 * Everything here is drawn from data the item already carries for its own
 * window — Quick Look is a faster way to the same content, not a second copy
 * of it kept in step by hand.
 */
const Preview = ({ item }: { item: FinderItem }) => {
  if (item.kind === "folder") {
    const children = item.children ?? [];
    return (
      <div className="ql-folder">
        <ItemIcon item={item} className="ql-folder-icon" />
        <p className="ql-count">
          {children.length} item{children.length === 1 ? "" : "s"}
        </p>
        <ul>
          {children.map((child) => (
            <li key={child.id}>
              <ItemIcon item={child} />
              <span className="truncate">{child.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (item.fileType === "img" && item.imageUrl) {
    return <img className="ql-image" src={item.imageUrl} alt={item.name} />;
  }

  if (item.fileType === "txt") {
    return (
      <div className="ql-text">
        {item.subtitle && <h3>{item.subtitle}</h3>}
        {(item.description ?? []).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }

  if (item.fileType === "url" || item.fileType === "fig") {
    return (
      <div className="ql-link">
        <ItemIcon item={item} className="ql-folder-icon" />
        <p className="ql-href">{item.href}</p>
      </div>
    );
  }

  /* PDFs and anything else: the icon and the name, which is what macOS shows
     while a preview it cannot render is being generated. The résumé has a whole
     window of its own, and the button below goes there. */
  return (
    <div className="ql-generic">
      <ItemIcon item={item} className="ql-folder-icon" />
      <p>{item.name}</p>
    </div>
  );
};

/**
 * Quick Look — the spacebar preview, as macOS has had for years and 26 keeps.
 *
 * Modal in the accessibility sense but not in the interaction one: it sits over
 * the desktop and takes focus, and either Escape or another press of Space puts
 * it away. The Finder is what decides *what* to show; this only shows it.
 */
const QuickLook = () => {
  const { item, close } = useQuickLookStore();
  const { setActiveLocation } = useLocationStore();
  const { openWindow } = useWindowStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /*
   * Focus moves into the panel when it opens, which is what makes Escape and
   * the buttons reachable without hunting. Where it goes back to is left to the
   * browser: the Finder item that opened this is still mounted and still
   * focused underneath.
   */
  useEffect(() => {
    if (item) closeRef.current?.focus();
  }, [item]);

  useGSAP(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.fromTo(
      panel,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: seconds(0.16), ease: "power2.out" }
    );
  }, [item?.id]);

  if (!item) return null;

  const open = () => {
    close();
    if (item.kind === "folder") {
      setActiveLocation(item);
      return openWindow("finder");
    }
    if (item.fileType === "pdf") return openWindow("resume");
    if ((item.fileType === "url" || item.fileType === "fig") && item.href)
      return window.open(item.href, "_blank");
    if (item.fileType === "txt") return openWindow("txtfile", item);
    if (item.fileType === "img") return openWindow("imgfile", item);
  };

  return (
    <div id="quick-look" onMouseDown={close}>
      <div
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Quick Look — ${item.name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <button
            ref={closeRef}
            type="button"
            className="ql-close"
            onClick={close}
            aria-label="Close Quick Look"
          >
            <X size={13} />
          </button>

          <h2 className="truncate">{item.name}</h2>

          <button type="button" className="ql-open" onClick={open}>
            <ExternalLink size={13} aria-hidden="true" />
            {openLabel(item)}
          </button>
        </header>

        <div className="ql-body">
          <Preview item={item} />
        </div>
      </div>
    </div>
  );
};

export default QuickLook;
