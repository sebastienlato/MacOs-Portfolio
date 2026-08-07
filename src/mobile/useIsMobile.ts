import { useEffect, useState } from "react";

/**
 * Below this the desktop stops being usable rather than merely cramped: the
 * Finder window alone is 48rem wide, and dragging, resizing and tiling all
 * assume a pointer and a canvas to throw windows around in.
 *
 * The height clause catches a phone turned sideways — 844px wide, but only
 * ~390px tall, which is less room than the menu bar and dock already reserve.
 */
const MOBILE_QUERY =
  "(max-width: 767px), (max-height: 500px) and (pointer: coarse)";

/** The same test outside React, for the work that happens before first render. */
export const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

const matches = isMobileViewport;

/**
 * Which shell to render. Read synchronously on the first render so the desktop
 * never paints for a frame on a phone.
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(matches);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
};

export default useIsMobile;
