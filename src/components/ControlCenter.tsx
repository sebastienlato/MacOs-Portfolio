import { useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Moon,
  Sun,
  Volume1,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import clsx from "clsx";

import useSystemStore from "#store/system";
import useWindowStore from "#store/window";

const MIN_BRIGHTNESS = 20;

const ControlCenter = () => {
  const {
    controlCenterOpen,
    toggleControlCenter,
    setControlCenterOpen,
    wifiEnabled,
    toggleWifi,
    theme,
    toggleTheme,
    brightness,
    setBrightness,
    volume,
    setVolume,
  } = useSystemStore();
  const { openWindow } = useWindowStore();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!controlCenterOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node))
        setControlCenterOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [controlCenterOpen, setControlCenterOpen]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  const openWallpaperSettings = () => {
    setControlCenterOpen(false);
    openWindow("settings");
  };

  return (
    <div id="control-center" ref={rootRef}>
      <button
        type="button"
        onClick={toggleControlCenter}
        aria-haspopup="dialog"
        aria-expanded={controlCenterOpen}
        aria-label="Control Center"
      >
        <img
          src="/icons/mode.svg"
          alt=""
          className="w-4 dark:invert"
        />
      </button>

      {controlCenterOpen && (
        <div className="cc-panel" role="dialog" aria-label="Control Center">
          <div className="tiles">
            <button type="button" className="tile" onClick={toggleWifi}>
              <span className={clsx("tile-icon", wifiEnabled && "on")}>
                {wifiEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
              </span>
              <span>
                <h4>Wi-Fi</h4>
                <p>{wifiEnabled ? "LatoNet" : "Off"}</p>
              </span>
            </button>

            <button type="button" className="tile" onClick={toggleTheme}>
              <span className={clsx("tile-icon", theme === "dark" && "on")}>
                {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              </span>
              <span>
                <h4>Appearance</h4>
                <p>{theme === "dark" ? "Dark" : "Light"}</p>
              </span>
            </button>
          </div>

          <div className="slider-group">
            <h4>Display</h4>
            <div className="slider-row">
              <Sun size={16} />
              <input
                type="range"
                min={MIN_BRIGHTNESS}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                aria-label="Brightness"
              />
            </div>
          </div>

          <div className="slider-group">
            <h4>Sound</h4>
            <div className="slider-row">
              <VolumeIcon size={16} />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
          </div>

          <button
            type="button"
            className="cc-footer"
            onClick={openWallpaperSettings}
          >
            <ImageIcon size={14} />
            Wallpaper Settings…
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlCenter;
