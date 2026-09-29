/**
 * What the Safari window can and cannot load.
 *
 * It is a real browser in the one sense that matters — the page is the live
 * site, in an iframe — and inherits the one rule an iframe cannot argue with:
 * a site decides whether it may be framed. Most large ones say no, through
 * `X-Frame-Options` or a CSP `frame-ancestors`, and a page cannot read either
 * header off another origin to find out in advance. So the refusals below are
 * a list, checked against the live headers in September 2026, and anything not
 * on it is simply tried. When an unlisted site refuses, the browser draws its
 * own error inside the frame, and the Share button still opens it for real.
 */

/** Google's own switch for its framable search page. */
const GOOGLE_SEARCH = "https://www.google.com/search?igu=1&q=";

/**
 * Hosts that refuse to be framed, matched with their subdomains. Google and
 * YouTube are here even though they have framable forms: those forms are what
 * `embeddable` rewrites to, and everything else on the host still refuses.
 */
const REFUSING_HOSTS = [
  "amazon.com",
  "anthropic.com",
  "apple.com",
  "bbc.com",
  "bing.com",
  "chatgpt.com",
  "claude.ai",
  "codepen.io",
  "dev.to",
  "developer.mozilla.org",
  "duckduckgo.com",
  "expo.dev",
  "facebook.com",
  "github.com",
  "gsap.com",
  "instagram.com",
  "linkedin.com",
  "medium.com",
  "netflix.com",
  "news.ycombinator.com",
  "nextjs.org",
  "npmjs.com",
  "nytimes.com",
  "openai.com",
  "reddit.com",
  "stackoverflow.com",
  "swift.org",
  "twitter.com",
  "vercel.com",
  "w3.org",
  "x.com",
];

const hostMatches = (host: string, domain: string) =>
  host === domain || host.endsWith(`.${domain}`);

/**
 * Turns whatever was typed into the address field into a URL, the way
 * Safari's field does: something shaped like an address is visited, anything
 * else is searched for.
 *
 * "Shaped like an address" is a scheme, `localhost`, or a dot with no spaces —
 * which is also why "react.dev" goes to the site and "react dev" searches.
 */
export const resolveInput = (input: string): string | null => {
  const text = input.trim();
  if (!text) return null;

  if (/^https?:\/\//i.test(text)) return text;

  const looksLikeAddress =
    !/\s/.test(text) &&
    (/^localhost(:\d+)?(\/|$)/i.test(text) || /^[^/]+\.[a-z]{2,}(:\d+)?(\/|$)/i.test(text));

  if (looksLikeAddress) {
    // http for localhost, since nothing local serves TLS
    return `${/^localhost/i.test(text) ? "http" : "https"}://${text}`;
  }

  return `${GOOGLE_SEARCH}${encodeURIComponent(text)}`;
};

/**
 * The form of a URL that will load in a frame, where the site offers one.
 *
 * Google's search pages frame when asked with `igu=1`, and a YouTube video
 * frames at its `/embed/` address. Everything else is returned as it came.
 */
export const embeddable = (url: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname;

  if (hostMatches(host, "google.com")) {
    const query = parsed.searchParams.get("q");
    if (query) return `${GOOGLE_SEARCH}${encodeURIComponent(query)}`;
    if (parsed.pathname === "/" || parsed.pathname === "/webhp") {
      return "https://www.google.com/webhp?igu=1";
    }
  }

  if (hostMatches(host, "youtube.com") && parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
  }

  if (host === "youtu.be" && parsed.pathname.length > 1) {
    return `https://www.youtube.com/embed${parsed.pathname}`;
  }

  return url;
};

/** True when the site is known to refuse being shown inside another page. */
export const refusesFraming = (url: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  // The two framable forms of hosts that otherwise refuse
  if (hostMatches(host, "google.com")) {
    return parsed.searchParams.get("igu") !== "1";
  }
  if (hostMatches(host, "youtube.com")) {
    return !parsed.pathname.startsWith("/embed/");
  }

  return REFUSING_HOSTS.some((domain) => hostMatches(host, domain));
};

/**
 * What the address field shows while it is not being edited. Safari shows
 * only the host there, and for a search, the words that were searched for.
 */
export const displayUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (hostMatches(parsed.hostname, "google.com")) {
      const query = parsed.searchParams.get("q");
      if (query) return query;
    }
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
