import useWindowStore from "#store/window";
import type { WindowKey } from "#types";

const WindowControls = ({ target }: { target: WindowKey }) => {
  const { closeWindow, minimizeWindow, toggleMaximizeWindow } =
    useWindowStore();

  return (
    <div id="window-controls">
      <div className="close" onClick={() => closeWindow(target)} />
      <div className="minimize" onClick={() => minimizeWindow(target)} />
      <div className="maximize" onClick={() => toggleMaximizeWindow(target)} />
    </div>
  );
};
export default WindowControls;
