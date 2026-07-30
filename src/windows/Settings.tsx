import { useRef, type ChangeEvent } from "react";
import { ImagePlus, Moon, RotateCcw, Sun, SunMoon } from "lucide-react";
import clsx from "clsx";

import WindowWrapper from "#hoc/WindowWrapper";
import { WindowControls } from "#components";
import { wallpapers } from "#constants/index";
import useSystemStore from "#store/system";
import type { Appearance, Wallpaper } from "#types";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // localStorage-friendly cap

const APPEARANCE_OPTIONS: {
  id: Appearance;
  label: string;
  Icon: typeof Sun;
}[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "auto", label: "Auto", Icon: SunMoon },
];

const Settings = () => {
  const {
    wallpaper,
    appearance,
    theme,
    setWallpaper,
    setCustomWallpaper,
    resetWallpaper,
    setAppearance,
  } = useSystemStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      alert("Please choose an image under 4 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCustomWallpaper(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const thumbStyle = (wp: Wallpaper) =>
    wp.type === "gradient"
      ? { backgroundImage: wp.value }
      : { backgroundImage: `url(${wp.value})` };

  return (
    <>
      <div id="window-header">
        <WindowControls target="settings" />
        <h2>System Settings</h2>
      </div>

      <div className="settings-content">
        <div className="section-title">
          <h3>Appearance</h3>
        </div>
        <p className="hint">
          How the menu bar, windows, and dock look.
          {appearance === "auto" &&
            ` Auto follows your system, which is currently ${theme}.`}
        </p>

        <div className="appearance">
          {APPEARANCE_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={clsx(appearance === id && "selected")}
              onClick={() => setAppearance(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="section-title">
          <h3>Wallpaper</h3>
          <button type="button" onClick={resetWallpaper}>
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
        <p className="hint">Pick a desktop background, or add your own image.</p>

        <ul className="wallpaper-grid">
          {wallpapers.map((wp) => (
            <li key={wp.id}>
              <button
                type="button"
                className={clsx(
                  "wallpaper-thumb",
                  wallpaper.id === wp.id && "selected"
                )}
                style={thumbStyle(wp)}
                onClick={() => setWallpaper(wp)}
                aria-label={`Use ${wp.name} wallpaper`}
              />
              <p>{wp.name}</p>
            </li>
          ))}

          <li>
            <button
              type="button"
              className={clsx(
                "wallpaper-thumb add",
                wallpaper.id === "custom" && "selected"
              )}
              style={
                wallpaper.id === "custom"
                  ? { backgroundImage: `url(${wallpaper.value})` }
                  : undefined
              }
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload a custom wallpaper"
            >
              {wallpaper.id !== "custom" && <ImagePlus size={20} />}
            </button>
            <p>{wallpaper.id === "custom" ? "Custom" : "Add Photo"}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </li>
        </ul>
      </div>
    </>
  );
};

const SettingsWindow = WindowWrapper(Settings, "settings");

export default SettingsWindow;
