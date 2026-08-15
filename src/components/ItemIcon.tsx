import { Briefcase, Code, Lock, Moon, PawPrint, Star, User } from "lucide-react";
import clsx from "clsx";

import useFolderStore, { badgeOf, keyOf } from "#store/folders";
import type { FinderItem, FolderBadge } from "#types";

/**
 * The glyphs a folder can wear, resolved from the name held in the data.
 *
 * Kept here rather than in `constants` so the data stays serialisable — a
 * folder says "lock" and this decides what a lock looks like.
 */
const BADGES: Record<FolderBadge, typeof Lock> = {
  lock: Lock,
  paw: PawPrint,
  moon: Moon,
  user: User,
  briefcase: Briefcase,
  code: Code,
  star: Star,
};

/**
 * A Finder item's icon, tinted and badged when it is a folder that asked to be.
 *
 * One component for every place an item is drawn — the icon grid, the list, the
 * two columns, the path bar, the sidebar, Spotlight, and the phone. They size
 * their icons very differently, from 64px down to 14px, so nothing here sets a
 * size: the existing `img` rule in each of those contexts still matches through
 * the wrapper, and the badge is sized as a fraction of whatever that turns out
 * to be. That is what keeps one component honest at five scales.
 */
const ItemIcon = ({
  item,
  className,
}: {
  item: FinderItem;
  className?: string;
}) => {
  /*
   * Whatever the visitor set in Get Info wins over what `constants` authored,
   * and only for folders — a file has no look to customise. Subscribed to the
   * slice rather than the store so recolouring one folder does not re-render
   * every icon on the screen.
   */
  const look = useFolderStore((state) =>
    item.kind === "folder" ? state.looks[keyOf(item)] : undefined
  );

  const color = look?.color ?? item.folderColor;
  const badgeName = badgeOf(look, item.folderBadge);
  const Badge = badgeName ? BADGES[badgeName] : null;

  return (
    <span
      className={clsx("item-icon", className)}
      // Read by CSS, which owns the hue rotation for each colour
      data-folder-color={color}
    >
      <img src={item.icon} alt="" />
      {/* Decorative: the folder's name is already beside it, and "lock" adds
          nothing a screen reader needs to hear about SecureVault */}
      {Badge && <Badge className="folder-badge" aria-hidden="true" />}
    </span>
  );
};

export default ItemIcon;
