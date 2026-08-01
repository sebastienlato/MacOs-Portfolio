import clsx from "clsx";
import type { CSSProperties } from "react";

import type { MobileApp, MobileLink } from "#mobile/constants";
import useMobileStore, { type OpenOrigin } from "#mobile/store";
import useSystemStore from "#store/system";
import type { IconStyle } from "#types";

const rectOf = (el: HTMLElement): OpenOrigin => {
  const { x, y, width, height } = el.getBoundingClientRect();
  return { x, y, width, height };
};

/**
 * A glyph tile's background under each icon appearance.
 *
 * Artwork tiles are recoloured by CSS, which cannot reach these: their colour
 * is an inline gradient, and inline styles outrank a stylesheet. Tinted takes
 * the accent outright, and Clear becomes the frosted glass the wallpaper reads
 * through — the same two ideas, applied where CSS could not.
 */
const tileBackground = (style: IconStyle, tint?: string) => {
  if (style === "tinted") return "var(--color-accent)";
  if (style === "clear") return "rgb(255 255 255 / 0.22)";
  return tint;
};

interface AppIconProps {
  app: MobileApp;
  /** Dock icons carry no label, exactly as on iOS. */
  showLabel?: boolean;
}

/** A Home Screen app icon. Tapping it hands the frame the box to zoom out of. */
export const AppIcon = ({ app, showLabel = true }: AppIconProps) => {
  const openApp = useMobileStore((state) => state.openApp);
  const iconStyle = useSystemStore((state) => state.iconStyle);
  const { id, name, icon, Glyph, tint } = app;

  return (
    <li className="app-icon">
      <button
        type="button"
        aria-label={`Open ${name}`}
        onClick={(e) => openApp(id, { origin: rectOf(e.currentTarget) })}
      >
        <span
          className={clsx("tile", icon ? "app-icon-art" : "glyph")}
          style={
            {
              // Artwork keeps its own transparent corners and is recoloured by
              // the masked overlay in CSS; a background here would fill the
              // square behind it instead of following the icon's shape
              background: icon ? undefined : tileBackground(iconStyle, tint),
              "--icon": icon ? `url(${icon})` : undefined,
            } as CSSProperties
          }
        >
          {icon ? <img src={icon} alt="" /> : Glyph ? <Glyph size={30} /> : null}
        </span>
      </button>

      {showLabel && <p>{name}</p>}
    </li>
  );
};

/** A web shortcut. Same tile, but it leaves for the real site. */
export const LinkIcon = ({ link }: { link: MobileLink }) => {
  const iconStyle = useSystemStore((state) => state.iconStyle);

  return (
    <li className="app-icon">
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${link.name} (opens in a new tab)`}
      >
        <span
          className="tile glyph"
          style={{ background: tileBackground(iconStyle, link.tint) }}
        >
          <img src={link.icon} alt="" className="link-glyph" />
        </span>
      </a>

      <p>{link.name}</p>
    </li>
  );
};
