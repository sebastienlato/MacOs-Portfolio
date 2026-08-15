import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Bed,
  Bluetooth,
  BluetoothOff,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Image as ImageIcon,
  Laptop,
  Headphones,
  Moon,
  Share2,
  Sun,
  User,
  Volume1,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import clsx from "clsx";

import { focusModes, soundOutputs } from "#constants/index";
import useSystemStore from "#store/system";
import useWindowStore from "#store/window";
import type { AirDropMode, FocusMode, SoundOutput } from "#types";

const MIN_BRIGHTNESS = 20;

/** Which pane of the popover is showing. macOS slides these in place. */
type Pane = "root" | "focus" | "sound";

const FOCUS_ICONS: Record<FocusMode["icon"], typeof Moon> = {
  moon: Moon,
  briefcase: Briefcase,
  user: User,
  bed: Bed,
  gamepad: Gamepad2,
};

const OUTPUT_ICONS: Record<SoundOutput["kind"], typeof Laptop> = {
  speakers: Laptop,
  headphones: Headphones,
  airplay: Share2,
};

const AIRDROP_LABELS: Record<AirDropMode, string> = {
  off: "Off",
  contacts: "Contacts Only",
  everyone: "Everyone",
};

/** Off → Contacts Only → Everyone → off, which is the order the real menu lists. */
const NEXT_AIRDROP: Record<AirDropMode, AirDropMode> = {
  off: "contacts",
  contacts: "everyone",
  everyone: "off",
};

/**
 * How far the slider's track is filled, as the `--value` the CSS gradient
 * stops at. Rescaled against the slider's own min so a brightness of 20 reads
 * as empty rather than a fifth full.
 */
const fillTo = (value: number, min = 0, max = 100) =>
  ({
    "--value": `${((value - min) / (max - min)) * 100}%`,
  }) as CSSProperties;

/**
 * One row of the connectivity group — Wi-Fi, Bluetooth, AirDrop.
 *
 * These are a single tall tile in macOS rather than three separate ones, which
 * is worth copying rather than approximating: it is the shape that makes the
 * panel read as Control Center at a glance.
 */
const ConnectivityRow = ({
  icon: Icon,
  label,
  detail,
  on,
  onClick,
}: {
  icon: typeof Wifi;
  label: string;
  detail: string;
  on: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className="conn-row"
    onClick={onClick}
    aria-pressed={on}
  >
    <span className={clsx("tile-icon", on && "on")}>
      <Icon size={15} />
    </span>
    <span className="conn-label">
      <h4>{label}</h4>
      <p>{detail}</p>
    </span>
  </button>
);

const ControlCenter = () => {
  const {
    controlCenterOpen,
    toggleControlCenter,
    setControlCenterOpen,
    wifiEnabled,
    toggleWifi,
    bluetoothEnabled,
    toggleBluetooth,
    airdrop,
    setAirdrop,
    focus,
    setFocus,
    output,
    setOutput,
    theme,
    toggleTheme,
    brightness,
    setBrightness,
    volume,
    setVolume,
  } = useSystemStore();
  const { openWindow } = useWindowStore();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pane, setPane] = useState<Pane>("root");

  useEffect(() => {
    if (!controlCenterOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node))
        setControlCenterOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [controlCenterOpen, setControlCenterOpen]);

  /*
   * A sub-pane is a place you navigated to, not a preference: closing the
   * popover and opening it again lands on the root, as macOS does.
   *
   * Adjusted during render rather than in an effect — the same shape the Finder
   * uses to drop its column selection when the location changes. An effect
   * would paint the stale pane for a frame first, and the popover is short
   * enough lived that the frame is most of what you would see.
   */
  const [paneOpenedWith, setPaneOpenedWith] = useState(controlCenterOpen);
  if (paneOpenedWith !== controlCenterOpen) {
    setPaneOpenedWith(controlCenterOpen);
    setPane("root");
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const activeFocus = focusModes.find((mode) => mode.id === focus) ?? null;
  const ActiveFocusIcon = activeFocus ? FOCUS_ICONS[activeFocus.icon] : Moon;
  const activeOutput =
    soundOutputs.find((device) => device.id === output) ?? soundOutputs[0];

  const openWallpaperSettings = () => {
    setControlCenterOpen(false);
    openWindow("settings");
  };

  const back = (
    <button
      type="button"
      className="cc-back"
      onClick={() => setPane("root")}
      aria-label="Back to Control Center"
    >
      <ChevronLeft size={15} />
    </button>
  );

  return (
    <div id="control-center" ref={rootRef}>
      <button
        type="button"
        onClick={toggleControlCenter}
        aria-haspopup="dialog"
        aria-expanded={controlCenterOpen}
        aria-label="Control Center"
      >
        <img src="/icons/mode.svg" alt="" className="w-4 invert" />
      </button>

      {controlCenterOpen && (
        <div className="cc-panel" role="dialog" aria-label="Control Center">
          {pane === "root" && (
            <>
              {/* The connectivity group: one tile, three rows */}
              <div className="conn-group">
                <ConnectivityRow
                  icon={wifiEnabled ? Wifi : WifiOff}
                  label="Wi-Fi"
                  detail={wifiEnabled ? "LatoNet" : "Off"}
                  on={wifiEnabled}
                  onClick={toggleWifi}
                />
                <ConnectivityRow
                  icon={bluetoothEnabled ? Bluetooth : BluetoothOff}
                  label="Bluetooth"
                  detail={bluetoothEnabled ? "On" : "Off"}
                  on={bluetoothEnabled}
                  onClick={toggleBluetooth}
                />
                <ConnectivityRow
                  icon={Share2}
                  label="AirDrop"
                  detail={AIRDROP_LABELS[airdrop]}
                  on={airdrop !== "off"}
                  onClick={() => setAirdrop(NEXT_AIRDROP[airdrop])}
                />
              </div>

              <div className="tiles">
                {/*
                  Focus both toggles and drills in, as the real tile does: the
                  body turns the last Focus on and off, the chevron opens the
                  list. Two buttons rather than one, so each has its own name.
                */}
                <div className={clsx("tile split", focus && "active")}>
                  <button
                    type="button"
                    className="tile-main"
                    onClick={() => setFocus(activeFocus?.id ?? "dnd")}
                    aria-pressed={Boolean(focus)}
                  >
                    <span className={clsx("tile-icon", focus && "on")}>
                      <ActiveFocusIcon size={16} />
                    </span>
                    <span>
                      <h4>Focus</h4>
                      <p>{activeFocus?.name ?? "Off"}</p>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="tile-more"
                    onClick={() => setPane("focus")}
                    aria-label="Focus options"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

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
                    style={fillTo(brightness, MIN_BRIGHTNESS)}
                    aria-label="Brightness"
                  />
                </div>
              </div>

              <div className="slider-group">
                <div className="group-head">
                  <h4>Sound</h4>
                  <button
                    type="button"
                    className="group-more"
                    onClick={() => setPane("sound")}
                    aria-label="Sound output options"
                  >
                    {activeOutput.name}
                    <ChevronRight size={13} />
                  </button>
                </div>
                <div className="slider-row">
                  <VolumeIcon size={16} />
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
              </div>

              <button
                type="button"
                className="cc-footer"
                onClick={openWallpaperSettings}
              >
                <ImageIcon size={14} />
                Wallpaper Settings…
              </button>
            </>
          )}

          {pane === "focus" && (
            <>
              <header className="cc-head">
                {back}
                <h3>Focus</h3>
              </header>

              <ul className="cc-list">
                {focusModes.map((mode) => {
                  const Icon = FOCUS_ICONS[mode.icon];
                  const on = focus === mode.id;
                  return (
                    <li key={mode.id}>
                      <button
                        type="button"
                        onClick={() => setFocus(mode.id)}
                        aria-pressed={on}
                      >
                        <span className={clsx("tile-icon", on && "on")}>
                          <Icon size={15} />
                        </span>
                        <span className="truncate">{mode.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p className="cc-note">
                {activeFocus
                  ? `Notifications are silenced while ${activeFocus.name} is on.`
                  : "Choose a Focus to silence notifications."}
              </p>
            </>
          )}

          {pane === "sound" && (
            <>
              <header className="cc-head">
                {back}
                <h3>Sound</h3>
              </header>

              <div className="slider-row standalone">
                <VolumeIcon size={16} />
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

              <h4 className="cc-subhead">Output</h4>
              <ul className="cc-list">
                {soundOutputs.map((device) => {
                  const Icon = OUTPUT_ICONS[device.kind];
                  const on = device.id === activeOutput.id;
                  return (
                    <li key={device.id}>
                      <button
                        type="button"
                        onClick={() => setOutput(device.id)}
                        aria-pressed={on}
                      >
                        <span className={clsx("tile-icon", on && "on")}>
                          <Icon size={15} />
                        </span>
                        <span className="truncate">{device.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlCenter;
