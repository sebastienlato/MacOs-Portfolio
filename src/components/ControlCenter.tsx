import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Airplay,
  Bed,
  Bluetooth,
  BluetoothOff,
  Briefcase,
  ChevronLeft,
  Contrast,
  FastForward,
  Gamepad2,
  Image as ImageIcon,
  LayoutGrid,
  Laptop,
  Headphones,
  Moon,
  Play,
  Rewind,
  Search,
  Share2,
  Sun,
  User,
  Volume,
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
 * Wi-Fi, Bluetooth, AirDrop: each its own capsule of glass in macOS 27, an
 * icon disc and two lines of label. 26 grouped them into one tall tile; 27
 * split every control into a module of its own, floating on the wallpaper.
 */
const ConnectivityModule = ({
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
    className="cc-module capsule"
    onClick={onClick}
    aria-pressed={on}
  >
    <span className={clsx("tile-icon", on && "on")}>
      <Icon size={17} strokeWidth={2.25} />
    </span>
    <span className="cc-label">
      <h4>{label}</h4>
      <p>{detail}</p>
    </span>
  </button>
);

/** A round module: one glyph, one action, white when it is on. */
const RoundModule = ({
  icon: Icon,
  label,
  on = false,
  onClick,
}: {
  icon: typeof Wifi;
  label: string;
  on?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={clsx("cc-module round", on && "on")}
    onClick={onClick}
    aria-label={label}
    aria-pressed={on}
  >
    <Icon size={24} strokeWidth={2} />
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
  const { openWindow, toggleMissionControl } = useWindowStore();
  const toggleSpotlight = useSystemStore((state) => state.toggleSpotlight);
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

  const VolumeIcon = volume === 0 ? VolumeX : Volume;
  const activeFocus = focusModes.find((mode) => mode.id === focus) ?? null;
  const ActiveFocusIcon = activeFocus ? FOCUS_ICONS[activeFocus.icon] : Moon;
  const activeOutput =
    soundOutputs.find((device) => device.id === output) ?? soundOutputs[0];

  const openWallpaperSettings = () => {
    setControlCenterOpen(false);
    openWindow("settings");
  };

  /* The round modules hand off to something else on screen, so they close
     Control Center on the way, as the real ones do */
  const thenClose = (action: () => void) => () => {
    setControlCenterOpen(false);
    action();
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
        <img src="/icons/mode.svg" alt="" className="w-4" />
      </button>

      {controlCenterOpen && (
        <div className="cc-panel" role="dialog" aria-label="Control Center">
          {/*
            The root is a grid of modules on macOS 27's own pitch: 64pt
            columns, 12pt gutters, so a round module is one cell, a capsule
            two, and Now Playing two by two. There is no panel behind them —
            each module is its own piece of glass on the wallpaper.

            Apple's three round modules here are Stage Manager, Screen
            Mirroring and keyboard brightness, none of which a portfolio has;
            the same cells hold the three things this desktop can do instead.
          */}
          {pane === "root" && (
            <div className="cc-grid">
              <ConnectivityModule
                icon={wifiEnabled ? Wifi : WifiOff}
                label="Wi-Fi"
                detail={wifiEnabled ? "LatoNet" : "Off"}
                on={wifiEnabled}
                onClick={toggleWifi}
              />

              {/* Nothing here plays anything, which is exactly what the real
                  tile says when that is true */}
              <div className="cc-module now-playing" aria-label="Now Playing">
                <span className="artwork" aria-hidden="true" />
                <h4>Not Playing</h4>
                <div className="transport" aria-hidden="true">
                  <Rewind size={18} fill="currentColor" strokeWidth={0} />
                  <Play size={20} fill="currentColor" strokeWidth={0} />
                  <FastForward size={18} fill="currentColor" strokeWidth={0} />
                </div>
              </div>

              <ConnectivityModule
                icon={bluetoothEnabled ? Bluetooth : BluetoothOff}
                label="Bluetooth"
                detail={bluetoothEnabled ? "On" : "Off"}
                on={bluetoothEnabled}
                onClick={toggleBluetooth}
              />

              <ConnectivityModule
                icon={Share2}
                label="AirDrop"
                detail={AIRDROP_LABELS[airdrop]}
                on={airdrop !== "off"}
                onClick={() => setAirdrop(NEXT_AIRDROP[airdrop])}
              />
              <RoundModule
                icon={LayoutGrid}
                label="Mission Control"
                onClick={thenClose(toggleMissionControl)}
              />
              <RoundModule
                icon={ImageIcon}
                label="Wallpaper Settings"
                onClick={openWallpaperSettings}
              />

              {/* Dark Mode is a round module in 27, white while it is on */}
              <RoundModule
                icon={Contrast}
                label="Dark Mode"
                on={theme === "dark"}
                onClick={toggleTheme}
              />
              <RoundModule
                icon={Search}
                label="Spotlight"
                onClick={thenClose(toggleSpotlight)}
              />

              {/*
                Focus both toggles and drills in, as the real module does: the
                disc turns the last Focus on and off, the label opens the
                list. Two buttons rather than one, so each has its own name.
              */}
              <div
                className={clsx("cc-module capsule split", focus && "active")}
              >
                <button
                  type="button"
                  className={clsx("tile-icon", focus && "on")}
                  onClick={() => setFocus(activeFocus?.id ?? "dnd")}
                  aria-pressed={Boolean(focus)}
                  aria-label="Focus"
                >
                  <ActiveFocusIcon size={17} strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  className="cc-label"
                  onClick={() => setPane("focus")}
                  aria-label="Focus options"
                >
                  <h4>Focus</h4>
                  {activeFocus && <p>{activeFocus.name}</p>}
                </button>
              </div>

              <div className="cc-module slider">
                <h4>Display</h4>
                <div className="slider-row">
                  <Sun size={13} className="end" />
                  <input
                    type="range"
                    min={MIN_BRIGHTNESS}
                    max={100}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    style={fillTo(brightness, MIN_BRIGHTNESS)}
                    aria-label="Brightness"
                  />
                  <Sun size={18} className="end" />
                </div>
              </div>

              <div className="cc-module slider">
                <h4>Sound</h4>
                <div className="slider-row">
                  <VolumeIcon size={15} className="end" fill="currentColor" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={fillTo(volume)}
                    aria-label="Volume"
                  />
                  <Volume2 size={17} className="end" fill="currentColor" />
                  {/* The way into the outputs, where 27 puts it */}
                  <button
                    type="button"
                    className="airplay"
                    onClick={() => setPane("sound")}
                    aria-label={`Sound output: ${activeOutput.name}`}
                  >
                    <Airplay size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {pane === "focus" && (
            <div className="cc-module expanded">
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
            </div>
          )}

          {pane === "sound" && (
            <div className="cc-module expanded">
              <header className="cc-head">
                {back}
                <h3>Sound</h3>
              </header>

              <div className="slider-row">
                <VolumeIcon size={15} className="end" fill="currentColor" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={fillTo(volume)}
                  aria-label="Volume"
                />
                <Volume2 size={17} className="end" fill="currentColor" />
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlCenter;
