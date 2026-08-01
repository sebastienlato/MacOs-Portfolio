import { useEffect, useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

import AppFrame from "#mobile/AppFrame";
import useMobileStore from "#mobile/store";
import { writeFilesHash } from "#mobile/useMobileDeepLink";
import { locations } from "#constants/index";
import useLocationStore from "#store/location";
import type { FinderItem } from "#types";

const ROOT_TITLE = "Portfolio";

/** Trash is the one folder whose contents can change, so it comes from the store. */
const useChildrenOf = (item: FinderItem) => {
  const trashItems = useLocationStore((state) => state.trashItems);
  return item.type === "trash" ? trashItems : (item.children ?? []);
};

const FolderList = ({
  item,
  onOpen,
}: {
  item: FinderItem;
  onOpen: (child: FinderItem) => void;
}) => {
  const children = useChildrenOf(item);

  if (children.length === 0) {
    return <p className="files-empty">Nothing in here.</p>;
  }

  return (
    <ul className="files-list">
      {children.map((child) => {
        const leaves = child.fileType === "url" || child.fileType === "fig";

        return (
          <li key={child.id}>
            <button type="button" onClick={() => onOpen(child)}>
              <img src={child.icon} alt="" />
              <span className="name">{child.name}</span>
              {leaves ? (
                <ExternalLink size={15} className="chevron" />
              ) : (
                <ChevronRight size={17} className="chevron" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

/** A .txt, rendered the way the desktop's TextEdit window renders it. */
const TextDetail = ({ item }: { item: FinderItem }) => (
  <article className="files-detail">
    {item.image && <img src={item.image} alt="" className="hero" />}
    {item.subtitle && <h2>{item.subtitle}</h2>}
    {item.description?.map((paragraph, i) => (
      <p key={i}>{paragraph}</p>
    ))}
  </article>
);

const ImageDetail = ({ item }: { item: FinderItem }) => (
  <div className="files-image">
    <img src={item.imageUrl} alt={item.name} />
  </div>
);

/**
 * Files, standing in for the desktop's Finder. The same location tree, walked
 * one level at a time instead of shown in a sidebar — which is what iOS does
 * with the very same content.
 */
const FilesApp = () => {
  const seed = useMobileStore((state) => state.path);
  const openApp = useMobileStore((state) => state.openApp);
  const [stack, setStack] = useState<FinderItem[]>(() => seed ?? []);

  const current = stack.at(-1) ?? null;
  const parent = stack.at(-2) ?? null;

  // Files is the one app whose address goes deeper than the app itself, so it
  // writes its own rather than letting the shell describe it as just "Files"
  useEffect(() => writeFilesHash(stack), [stack]);

  const open = (item: FinderItem) => {
    if (item.fileType === "pdf") return openApp("resume");

    if ((item.fileType === "url" || item.fileType === "fig") && item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }

    setStack((prev) => [...prev, item]);
  };

  const body = () => {
    if (!current) {
      return (
        <>
          <h2 className="files-section">Locations</h2>
          <ul className="files-list">
            {Object.values(locations).map((location) => (
              <li key={location.id}>
                <button type="button" onClick={() => open(location)}>
                  <img src={location.icon} alt="" className="location" />
                  <span className="name">{location.name}</span>
                  <ChevronRight size={17} className="chevron" />
                </button>
              </li>
            ))}
          </ul>
        </>
      );
    }

    if (current.kind === "folder") {
      return <FolderList item={current} onOpen={open} />;
    }

    if (current.fileType === "img") return <ImageDetail item={current} />;

    return <TextDetail item={current} />;
  };

  return (
    <AppFrame
      title={current?.name ?? ROOT_TITLE}
      onBack={stack.length ? () => setStack((prev) => prev.slice(0, -1)) : undefined}
      backLabel={parent?.name ?? ROOT_TITLE}
    >
      {body()}
    </AppFrame>
  );
};

export default FilesApp;
