import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoveRight,
  PanelLeft,
  Plus,
  RotateCw,
  Search,
  Share,
  ShieldHalf,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { blogPosts, browserFavorites } from "#constants/index";
import useBrowserStore, { currentUrl } from "#store/browser";
import useWindowStore from "#store/window";
import { displayUrl, embeddable, refusesFraming, resolveInput } from "#utils/browser";

const openOutside = (url: string) =>
  window.open(url, "_blank", "noopener,noreferrer");

/**
 * The Start Page: Favorites, then the articles this window used to be nothing
 * but. The articles still leave for dev.to, which refuses to be framed.
 */
const StartPage = () => {
  const navigate = useBrowserStore((state) => state.navigate);

  return (
    <div className="start-page">
      <section>
        <h2>Favorites</h2>

        <ul className="favorites">
          {browserFavorites.map(({ title, url, color }) => (
            <li key={url}>
              <button type="button" onClick={() => navigate(url)}>
                <span className="tile" style={{ backgroundColor: color }} aria-hidden="true">
                  {title[0]}
                </span>
                <span className="label">{title}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>My Developer Blog</h2>

        <div className="space-y-8">
          {blogPosts.map(({ id, image, title, date, link }) => (
            <div key={id} className="blog-post">
              <div className="col-span-2">
                <img src={image} alt={title} />
              </div>

              <div className="content">
                <p>{date}</p>
                <h3>{title}</h3>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  Check out the full post <MoveRight className="icon-hover" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/** What a site that will not be framed gets instead of a blank rectangle. */
const Refused = ({ url }: { url: string }) => (
  <div className="refused">
    <h2>Safari Can’t Show This Page Here</h2>
    <p>
      {displayUrl(url)} doesn’t allow itself to be shown inside another page, so
      it has to open in a tab of its own.
    </p>
    <button type="button" onClick={() => openOutside(url)}>
      Open in New Tab
    </button>
  </div>
);

/**
 * The page, live. Keyed by the parent on every navigation, so each visit is a
 * fresh frame rather than a new `src` on the old one: changing an iframe's
 * `src` pushes an entry onto the *real* tab's history, and the browser's own
 * Back button would start walking this frame instead of the desktop.
 *
 * No `allow-top-navigation` in the sandbox: some sites answer being framed by
 * trying to navigate the top window, which here is the whole desktop.
 */
const Page = ({
  url,
  frameRef,
}: {
  url: string;
  frameRef: RefObject<HTMLIFrameElement | null>;
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="progress" aria-hidden="true" />}
      <iframe
        ref={frameRef}
        src={url}
        title={displayUrl(url)}
        onLoad={() => setLoaded(true)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </>
  );
};

const Safari = () => {
  const { history, index, reloadKey, navigate, back, forward, reload } =
    useBrowserStore();
  const url = useBrowserStore(currentUrl);
  const [draft, setDraft] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /*
   * A click inside the frame lands in another document, so the window's own
   * mousedown never hears it and the window would stay behind whatever was in
   * front. What the parent does get is its own blur, with the frame left as
   * the active element — which is a click in the page by another name.
   */
  useEffect(() => {
    const onBlur = () => {
      if (frameRef.current && document.activeElement === frameRef.current) {
        useWindowStore.getState().focusWindow("safari");
      }
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const resolved = draft === null ? null : resolveInput(draft);
    if (resolved) navigate(embeddable(resolved));
    setDraft(null);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <>
      {/*
        The toolbar sheds its groups as the window narrows, the way Safari's
        does, and the address field is the last thing standing. Which groups
        are still there is decided in CSS, from the width of the window rather
        than of the screen — see the container queries on #safari.
      */}
      <div id="window-header">
        <WindowControls target="safari" />

        <div className="toolbar-nav">
          <PanelLeft className="icon" aria-hidden="true" />
          <button type="button" aria-label="Back" disabled={index === 0} onClick={back}>
            <ChevronLeft className="icon" />
          </button>
          <button
            type="button"
            aria-label="Forward"
            disabled={index === history.length - 1}
            onClick={forward}
          >
            <ChevronRight className="icon" />
          </button>
        </div>

        <div className="address">
          <ShieldHalf className="icon" aria-hidden="true" />

          <form className="search" onSubmit={submit} role="search">
            <Search className="icon" aria-hidden="true" />

            {/*
              Showing the host at rest and the whole address while editing,
              as Safari does. Focus hands over the full URL, selected, so
              typing replaces it and ⌘C copies it.
            */}
            <input
              type="text"
              aria-label="Address"
              placeholder="Search or enter website name"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={draft ?? (url ? displayUrl(url) : "")}
              onFocus={(e) => {
                setDraft(url ?? "");
                const input = e.currentTarget;
                requestAnimationFrame(() => input.select());
              }}
              onBlur={() => setDraft(null)}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") e.currentTarget.blur();
              }}
            />

            {url && draft === null && (
              <button type="button" className="reload" aria-label="Reload" onClick={reload}>
                <RotateCw size={13} strokeWidth={2.25} />
              </button>
            )}
          </form>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            aria-label="Open in New Tab"
            title="Open in New Tab"
            disabled={!url}
            onClick={() => url && openOutside(url)}
          >
            <Share className="icon" />
          </button>
          <button
            type="button"
            aria-label="Start Page"
            title="Start Page"
            onClick={() => navigate(null)}
          >
            <Plus className="icon" />
          </button>
          <Copy className="icon" aria-hidden="true" />
        </div>
      </div>

      <div className="browser-view">
        {url === null ? (
          <StartPage />
        ) : refusesFraming(url) ? (
          <Refused url={url} />
        ) : (
          <Page key={`${index}:${reloadKey}:${url}`} url={url} frameRef={frameRef} />
        )}
      </div>
    </>
  );
};

const SafariWindow = WindowWrapper(Safari, "safari");

export default SafariWindow;
