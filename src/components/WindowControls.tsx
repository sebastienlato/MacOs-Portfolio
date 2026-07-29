import useWindowStore from "#store/window";
import type { WindowKey } from "#types";

const WindowControls = ({ target }: { target: WindowKey }) => {
  const { closeWindow, minimizeWindow, toggleMaximizeWindow } =
    useWindowStore();

  return (
    /*
     * Buttons rather than divs: these are a window's primary controls, and as
     * divs they were unreachable by keyboard and unnamed to screen readers.
     * The ×/−/+ glyphs are drawn in CSS and only appear on hover, as in macOS.
     */
    <div id="window-controls">
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
      <button
        type="button"
        className="maximize"
        aria-label="Zoom window"
        onClick={() => toggleMaximizeWindow(target)}
      />
    </div>
  );
};
export default WindowControls;
