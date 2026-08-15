import { useEffect, useRef } from "react";
import {
  Briefcase,
  Code,
  Lock,
  Moon,
  PawPrint,
  RotateCcw,
  Star,
  User,
  X,
} from "lucide-react";
import clsx from "clsx";

import ItemIcon from "#components/ItemIcon";
import useFolderStore, { badgeOf, keyOf } from "#store/folders";
import useInfoStore from "#store/info";
import type { FolderBadge, FolderColor } from "#types";

/** Every tint a folder can take, in the order Get Info lists them. */
const COLORS: FolderColor[] = [
  "blue",
  "teal",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "graphite",
];

const BADGES: { id: FolderBadge; Icon: typeof Lock }[] = [
  { id: "lock", Icon: Lock },
  { id: "paw", Icon: PawPrint },
  { id: "moon", Icon: Moon },
  { id: "user", Icon: User },
  { id: "briefcase", Icon: Briefcase },
  { id: "code", Icon: Code },
  { id: "star", Icon: Star },
];

/**
 * Get Info, and the folder customisation macOS 26 puts in it.
 *
 * The colours and badges were authored in `constants` when they arrived; this
 * is what lets a visitor change their mind. Nothing here writes back to the
 * data — the store holds overrides, so a folder left alone keeps whatever was
 * shipped and Reset is a deletion rather than a second set of values.
 */
const GetInfo = () => {
  const { item, close } = useInfoStore();
  const looks = useFolderStore((state) => state.looks);
  const setLook = useFolderStore((state) => state.setLook);
  const resetLook = useFolderStore((state) => state.resetLook);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (item) closeRef.current?.focus();
  }, [item]);

  if (!item) return null;

  const look = looks[keyOf(item)] ?? {};
  const color = look.color ?? item.folderColor;
  const badge = badgeOf(look, item.folderBadge);
  const customised = Boolean(looks[keyOf(item)]);
  const count = (item.children ?? []).length;

  return (
    <div id="get-info" onMouseDown={close}>
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} Info`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <button
            ref={closeRef}
            type="button"
            className="gi-close"
            onClick={close}
            aria-label="Close Info"
          >
            <X size={13} />
          </button>
          <h2 className="truncate">{item.name} Info</h2>
        </header>

        <div className="gi-body">
          <div className="gi-preview">
            {/* Live: it is the same component the Finder draws, so the
                swatches below are previewed on the real thing */}
            <ItemIcon item={item} className="gi-icon" />
            <p className="gi-name truncate">{item.name}</p>
            <p className="gi-kind">
              Folder — {count} item{count === 1 ? "" : "s"}
            </p>
          </div>

          <h3>Colour</h3>
          <ul className="gi-colors">
            {COLORS.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  className={clsx("swatch", color === option && "selected")}
                  data-folder-color={option}
                  onClick={() => setLook(item, { color: option })}
                  aria-label={option}
                  aria-pressed={color === option}
                />
              </li>
            ))}
          </ul>

          <h3>Badge</h3>
          <ul className="gi-badges">
            {BADGES.map(({ id, Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  className={clsx(badge === id && "selected")}
                  onClick={() =>
                    // Choosing the badge already on takes it off, the way the
                    // Focus tile in Control Center turns itself off
                    setLook(item, { badge: badge === id ? "none" : id })
                  }
                  aria-label={id}
                  aria-pressed={badge === id}
                >
                  <Icon size={15} />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="gi-reset"
            onClick={() => resetLook(item)}
            disabled={!customised}
          >
            <RotateCcw size={12} />
            Reset to default
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetInfo;
