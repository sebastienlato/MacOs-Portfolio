import { useState, type FormEvent } from "react";
import { ArrowUpRight, ChevronLeft, RotateCw, Share } from "lucide-react";

import AppFrame from "#mobile/AppFrame";
import { blogPosts, browserFavorites } from "#constants/index";
import useBrowserStore, { currentUrl } from "#store/browser";
import {
  displayUrl,
  embeddable,
  openInNewTab,
  refusesFraming,
  resolveInput,
} from "#utils/browser";
// By file, not from the barrel, which would carry the whole desktop with it
import BrowserPage from "#components/BrowserPage";

/**
 * The Start Page: Favorites, then the blog this app used to be nothing but.
 * The posts still leave for dev.to, which refuses to be framed.
 */
const StartPage = () => {
  const navigate = useBrowserStore((state) => state.navigate);

  return (
    <div className="start-page">
      <h2 className="section-heading">Favorites</h2>

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

      <h2 className="section-heading">My Developer Blog</h2>

      <ul className="article-list">
        {blogPosts.map(({ id, image, title, date, link }) => (
          <li key={id}>
            <a href={link} target="_blank" rel="noopener noreferrer">
              <img src={image} alt="" />

              <div className="body">
                <p className="date">{date}</p>
                <h3>{title}</h3>
                <span className="cta">
                  Read on dev.to <ArrowUpRight size={13} />
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** What a site that will not be framed gets instead of a blank screen. */
const Refused = ({ url }: { url: string }) => (
  <div className="refused">
    <h2>Safari Can’t Show This Page Here</h2>
    <p>
      {displayUrl(url)} doesn’t allow itself to be shown inside another page, so
      it has to open in a tab of its own.
    </p>
    <button type="button" onClick={() => openInNewTab(url)}>
      Open in New Tab
    </button>
  </div>
);

/**
 * Safari on the phone: the page to the status bar, and the controls in a glass
 * bar along the bottom, where iOS has kept them since 15 — within reach of a
 * thumb. Same history as the desktop's window; the two never mount together.
 *
 * Back steps through the pages opened from here and lands on the Start Page.
 * Leaving the app is the home bar's job, as it is in every other app.
 */
const SafariApp = () => {
  const { index, reloadKey, navigate, back, reload } = useBrowserStore();
  const url = useBrowserStore(currentUrl);
  const [draft, setDraft] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const resolved = draft === null ? null : resolveInput(draft);
    if (resolved) navigate(embeddable(resolved));
    setDraft(null);
    // Puts the keyboard away, which is what Go does on iOS
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <AppFrame title="Safari" bare>
      <div className="ios-browser">
        <div className="page">
          {url === null ? (
            <StartPage />
          ) : refusesFraming(url) ? (
            <Refused url={url} />
          ) : (
            <BrowserPage key={`${index}:${reloadKey}:${url}`} url={url} />
          )}
        </div>

        <div className="browser-bar">
          <button type="button" aria-label="Back" disabled={index === 0} onClick={back}>
            <ChevronLeft size={24} />
          </button>

          <form className="address" onSubmit={submit} role="search">
            {/* enterKeyHint puts "go" on the return key, as Safari's own does */}
            <input
              type="text"
              inputMode="url"
              enterKeyHint="go"
              aria-label="Address"
              placeholder="Search or enter website"
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
            />

            {url && draft === null && (
              <button type="button" className="reload" aria-label="Reload" onClick={reload}>
                <RotateCw size={15} />
              </button>
            )}
          </form>

          <button
            type="button"
            aria-label="Open in New Tab"
            disabled={!url}
            onClick={() => url && openInNewTab(url)}
          >
            <Share size={20} />
          </button>
        </div>
      </div>
    </AppFrame>
  );
};

export default SafariApp;
