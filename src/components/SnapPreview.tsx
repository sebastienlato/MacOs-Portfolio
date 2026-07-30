import clsx from "clsx";

import useSnapStore from "#store/snap";

/**
 * The ghost that shows where a dragged window will land. macOS paints the
 * target region while you hold a window against a screen edge, so the tile is
 * committed knowingly rather than as a surprise on release.
 */
const SnapPreview = () => {
  const zone = useSnapStore((state) => state.zone);

  if (!zone) return null;

  return <div className={clsx("snap-preview", `snap-${zone}`)} aria-hidden="true" />;
};

export default SnapPreview;
