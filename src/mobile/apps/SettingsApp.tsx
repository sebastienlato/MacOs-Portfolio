import { useRef, type ChangeEvent } from "react";
import { ImagePlus, Moon, RotateCcw, Sun, SunMoon } from "lucide-react";
import clsx from "clsx";

import AppFrame from "#mobile/AppFrame";
import { accents, iconStyles, wallpapers } from "#constants/index";
import useSystemStore from "#store/system";
import type { Appearance, Wallpaper } from "#types";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // localStorage-friendly cap

const APPEARANCE_OPTIONS: { id: Appearance; label: string; Icon: typeof Sun }[] =
  [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "auto", label: "Auto", Icon: SunMoon },
  ];

const thumbStyle = (wp: Wallpaper) =>
  wp.type === "gradient"
    ? { backgroundImage: wp.value }
    : { backgroundImage: `url(${wp.value})` };

/**
 * The same settings the desktop window offers, laid out as iOS grouped rows.
 * Both shells write to the one system store, so a wallpaper picked here is the
 * wallpaper a wider window opens with.
 *
 * Every group is a heading, a card, and an optional line of footer text — the
 * shape iOS Settings has had since it was Preferences, and the shape Files,
 * Contact and About on this phone were already using. This screen was the one
 * that was not: its controls sat straight on the page background, which in dark
 * mode meant a flat black sheet with a segmented control floating on it. The
 * card is what gives a grouped screen its structure, and the explanatory line
 * belongs *under* the thing it explains, which is where iOS puts it.
 */
const SettingsApp = () => {
  const {
    wallpaper,
    appearance,
    theme,
    accent,
    iconStyle,
    setAccent,
    setIconStyle,
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

  return (
    <AppFrame title="Settings">
      <section className="settings-group">
        <h2 className="files-section">Appearance</h2>

        <div className="settings-card">
          <div className="segmented">
            {APPEARANCE_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={clsx(appearance === id && "selected")}
                aria-pressed={appearance === id}
                onClick={() => setAppearance(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="settings-hint">
          How the wallpaper, panels, and apps look.
          {appearance === "auto" &&
            ` Auto follows your phone, which is currently ${theme}.`}
        </p>
      </section>

      <section className="settings-group">
        <h2 className="files-section">Accent colour</h2>

        <div className="settings-card">
          <ul className="accent-swatches">
            {accents.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={clsx(accent.id === option.id && "selected")}
                  style={{ backgroundColor: option.value }}
                  onClick={() => setAccent(option)}
                  aria-label={option.name}
                  aria-pressed={accent.id === option.id}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="files-section">Icon style</h2>

        <div className="settings-card">
          <div className="segmented">
            {iconStyles.map((option) => (
              <button
                key={option.id}
                type="button"
                className={clsx(iconStyle === option.id && "selected")}
                aria-pressed={iconStyle === option.id}
                onClick={() => setIconStyle(option.id)}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        <p className="settings-hint">Tinted takes the accent colour.</p>
      </section>

      <section className="settings-group">
        <h2 className="files-section">Wallpaper</h2>

        <div className="settings-card">
          <ul className="wallpaper-tiles">
            {wallpapers.map((wp) => (
              <li key={wp.id}>
                <button
                  type="button"
                  className={clsx("thumb", wallpaper.id === wp.id && "selected")}
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
                  "thumb add",
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
                {wallpaper.id !== "custom" && <ImagePlus size={18} />}
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

          {/* A row at the foot of the card rather than a link beside the
              heading, which is where iOS keeps an action that belongs to the
              group — and it stops Reset reading as part of the title. */}
          <button type="button" className="settings-action" onClick={resetWallpaper}>
            <RotateCcw size={16} />
            Reset to default
          </button>
        </div>
      </section>
    </AppFrame>
  );
};

export default SettingsApp;
