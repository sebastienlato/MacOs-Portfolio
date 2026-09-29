import { useState, type RefObject } from "react";

import { displayUrl } from "#utils/browser";

/**
 * The page, live — shared by the desktop's Safari window and the phone's
 * Safari app, which differ in their chrome and not at all in this.
 *
 * Keyed by the parent on every navigation, so each visit is a fresh frame
 * rather than a new `src` on the old one: changing an iframe's `src` pushes an
 * entry onto the *real* tab's history, and the browser's own Back button would
 * start walking this frame instead of the site.
 *
 * No `allow-top-navigation` in the sandbox: some sites answer being framed by
 * trying to navigate the top window, which here is the whole portfolio.
 *
 * The progress bar is the parent's to style; this only says when to show it.
 */
const BrowserPage = ({
  url,
  frameRef,
}: {
  url: string;
  frameRef?: RefObject<HTMLIFrameElement | null>;
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

export default BrowserPage;
