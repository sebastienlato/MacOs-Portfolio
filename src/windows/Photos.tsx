import type { CSSProperties } from "react";
import { Mail, Search } from "lucide-react";

import WindowWrapper from "#hoc/WindowWrapper";
import WindowControls from "#components/WindowControls";
import { gallery, photosLinks } from "#constants/index";
import useWindowStore from "#store/window";

const Photos = () => {
  const { openWindow } = useWindowStore();

  return (
    <>
      <div id="window-header">
        <WindowControls target="photos" />

        <div className="w-full flex justify-end">
          <div className="toolbar-group">
            <Mail className="icon" />
            <Search className="icon" />
          </div>
        </div>
      </div>

      <div className="flex w-full">
        <div className="sidebar">
          <h2>Photos</h2>

          <ul>
            {photosLinks.map(({ id, icon, title }) => (
              <li key={id}>
                {/* Painted in the accent, as the Finder's sidebar is. The name
                    is in the <p> beside it, so the image stays unannounced */}
                <img
                  src={icon}
                  className="accent-glyph"
                  style={{ "--icon": `url(${icon})` } as CSSProperties}
                  alt=""
                />
                <p>{title}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="gallery">
          <ul>
            {gallery.map(({ id, img }, index) => (
              <li key={id}>
                {/* A button, so a thumbnail can be reached and opened without
                    a pointer — the phone's gallery already works this way */}
                <button
                  type="button"
                  aria-label={`Open gallery image ${index + 1}`}
                  onClick={() =>
                    openWindow("imgfile", {
                      id,
                      name: "Gallery image",
                      icon: "/images/image.webp",
                      kind: "file",
                      fileType: "img",
                      imageUrl: img,
                    })
                  }
                >
                  <img src={img} alt="" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

const PhotosWindow = WindowWrapper(Photos, "photos");
PhotosWindow.displayName = "Photos";

export default PhotosWindow;
