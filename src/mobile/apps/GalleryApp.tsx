import { useState } from "react";

import AppFrame from "#mobile/AppFrame";
import { gallery } from "#constants/index";

/**
 * Photos. A square grid, as on the desktop — two columns rather than as many as
 * fit, since a phone has room for exactly that many before a thumbnail stops
 * being worth tapping. Tapping one opens it in place instead of in a window.
 */
const GalleryApp = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex === null ? null : gallery[openIndex];

  return (
    <AppFrame
      title={open ? `${openIndex! + 1} of ${gallery.length}` : "Gallery"}
      onBack={open ? () => setOpenIndex(null) : undefined}
      backLabel="Gallery"
    >
      {open ? (
        <div className="photo-viewer">
          <img src={open.img} alt={`Gallery image ${open.id}`} />
        </div>
      ) : (
        <ul className="photo-grid">
          {gallery.map(({ id, img }, index) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Open gallery image ${index + 1}`}
              >
                <img src={img} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppFrame>
  );
};

export default GalleryApp;
