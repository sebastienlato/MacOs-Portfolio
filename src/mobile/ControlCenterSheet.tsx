import { type CSSProperties } from "react";
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

import useMobileStore from "#mobile/store";
import useSystemStore from "#store/system";

const MIN_BRIGHTNESS = 20;

/** How far the track is filled, as the stop the CSS gradient runs to. */
const fillTo = (value: number, min = 0, max = 100) =>
  ({ "--value": `${((value - min) / (max - min)) * 100}%` }) as CSSProperties;

/**
 * Control Center, pulled down from the status bar. Same store as the desktop
 * panel, so Wi-Fi, appearance, brightness and volume are one set of switches
 * whichever shell the visitor is in.
 */
const ControlCenterSheet = () => {
  const {
    controlCenterOpen,
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
  const openApp = useMobileStore((state) => state.openApp);

  if (!controlCenterOpen) return null;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  const openWallpaperSettings = () => {
    setControlCenterOpen(false);
    openApp("settings");
  };

  return (
    <>
      {/* Catches the tap that closes the sheet */}
      <div
        className="cc-sheet-backdrop"
        onClick={() => setControlCenterOpen(false)}
      />

      <div className="cc-sheet" role="dialog" aria-label="Control Center">
        <div className="cc-tiles">
          <button type="button" className="cc-tile" onClick={toggleWifi}>
            <span className={clsx("glyph", wifiEnabled && "on")}>
              {wifiEnabled ? <Wifi size={18} /> : <WifiOff size={18} />}
            </span>
            <span>
              <strong>Wi-Fi</strong>
              <small>{wifiEnabled ? "LatoNet" : "Off"}</small>
            </span>
          </button>

          <button type="button" className="cc-tile" onClick={toggleTheme}>
            <span className={clsx("glyph", theme === "dark" && "on")}>
              {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            </span>
            <span>
              <strong>Appearance</strong>
              <small>{theme === "dark" ? "Dark" : "Light"}</small>
            </span>
          </button>
        </div>

        <div className="cc-slider">
          <Sun size={18} />
          <input
            type="range"
            min={MIN_BRIGHTNESS}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={fillTo(brightness, MIN_BRIGHTNESS)}
            aria-label="Brightness"
          />
        </div>

        <div className="cc-slider">
          <VolumeIcon size={18} />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={fillTo(volume)}
            aria-label="Volume"
          />
        </div>

        <button
          type="button"
          className="cc-footer"
          onClick={openWallpaperSettings}
        >
          <ImageIcon size={15} />
          Wallpaper Settings…
        </button>
      </div>
    </>
  );
};

export default ControlCenterSheet;
