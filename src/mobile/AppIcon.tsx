import clsx from "clsx";

import type { MobileApp, MobileLink } from "#mobile/constants";
import useMobileStore, { type OpenOrigin } from "#mobile/store";

const rectOf = (el: HTMLElement): OpenOrigin => {
  const { x, y, width, height } = el.getBoundingClientRect();
  return { x, y, width, height };
};

interface AppIconProps {
  app: MobileApp;
  /** Dock icons carry no label, exactly as on iOS. */
  showLabel?: boolean;
}

/** A Home Screen app icon. Tapping it hands the frame the box to zoom out of. */
export const AppIcon = ({ app, showLabel = true }: AppIconProps) => {
  const openApp = useMobileStore((state) => state.openApp);
  const { id, name, icon, Glyph, tint } = app;

  return (
    <li className="app-icon">
      <button
        type="button"
        aria-label={`Open ${name}`}
        onClick={(e) => openApp(id, { origin: rectOf(e.currentTarget) })}
      >
        <span className={clsx("tile", !icon && "glyph")} style={{ background: tint }}>
          {icon ? <img src={icon} alt="" /> : Glyph ? <Glyph size={30} /> : null}
        </span>
      </button>

      {showLabel && <p>{name}</p>}
    </li>
  );
};

/** A web shortcut. Same tile, but it leaves for the real site. */
export const LinkIcon = ({ link }: { link: MobileLink }) => (
  <li className="app-icon">
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${link.name} (opens in a new tab)`}
    >
      <span className="tile glyph" style={{ background: link.tint }}>
        <img src={link.icon} alt="" className="link-glyph" />
      </span>
    </a>

    <p>{link.name}</p>
  </li>
);
