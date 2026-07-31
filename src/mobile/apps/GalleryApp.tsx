import { useState } from "react";

import AppFrame from "#mobile/AppFrame";
import { gallery } from "#constants/index";

/**
 * Photos. The desktop lays its four images out in a hand-placed mosaic; on a
 * phone that becomes a plain square grid, which is both what iOS does and what
 * survives someone adding a fifth photo.
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
