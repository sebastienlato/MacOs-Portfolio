import { useEffect, useRef, useState } from "react";

import useWindowStore from "#store/window";
import type { WindowKey, WindowTile } from "#types";

/** How long the pointer has to rest on the green button before tiling appears. */
const HOVER_DELAY = 350;

const TILE_OPTIONS: { tile: WindowTile; label: string }[] = [
  { tile: "fill", label: "Fill Screen" },
  { tile: "left", label: "Left Half" },
  { tile: "right", label: "Right Half" },
];

const WindowControls = ({ target }: { target: WindowKey }) => {
  const { closeWindow, minimizeWindow, toggleZoom, tileWindow } =
    useWindowStore();
  const [tilingOpen, setTilingOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => cancelTimer, []);

  return (
    /*
     * Buttons rather than divs: these are a window's primary controls, and as
     * divs they were unreachable by keyboard and unnamed to screen readers.
     * The ×/−/+ glyphs are drawn in CSS and only appear on hover, as in macOS.
     */
    <div
      id="window-controls"
      onMouseLeave={() => {
        cancelTimer();
        setTilingOpen(false);
      }}
    >
      <button
        type="button"
        className="close"
        aria-label="Close window"
        onClick={() => closeWindow(target)}
      />
      <button
        type="button"
        className="minimize"
        aria-label="Minimize window"
        onClick={() => minimizeWindow(target)}
      />

      {/* Resting on the green button reveals the tiling options, the way
          macOS surfaces Fill and the halves without a click */}
      <div
        className="zoom"
        onMouseEnter={() => {
          cancelTimer();
          timer.current = setTimeout(() => setTilingOpen(true), HOVER_DELAY);
        }}
      >
        <button
          type="button"
          className="maximize"
          aria-label="Zoom window"
          aria-haspopup="menu"
          aria-expanded={tilingOpen}
          onClick={() => {
            cancelTimer();
            setTilingOpen(false);
            toggleZoom(target);
          }}
        />

        {tilingOpen && (
          <ul className="tile-menu" role="menu">
            {TILE_OPTIONS.map(({ tile, label }) => (
              <li key={tile} role="menuitem">
                <button
                  type="button"
                  className={`preview preview-${tile}`}
                  onClick={() => {
                    setTilingOpen(false);
                    tileWindow(target, tile);
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
export default WindowControls;
