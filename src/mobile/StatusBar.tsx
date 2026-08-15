import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Wifi, WifiOff } from "lucide-react";

import useSystemStore from "#store/system";

/**
 * The iOS status bar. The battery is drawn rather than iconed so its fill can
 * track the volume slider — there is no battery to report, and a bar that never
 * moves is the kind of dead detail that gives the whole illusion away.
 */
const StatusBar = () => {
  const wifiEnabled = useSystemStore((state) => state.wifiEnabled);
  const toggleControlCenter = useSystemStore(
    (state) => state.toggleControlCenter
  );
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 10_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="status-bar">
      <span className="time">{now.format("h:mm")}</span>

      {/* The Dynamic Island. Decoration, and the single strongest tell that
          this is meant to be a current iPhone rather than a phone in general —
          the status bar reads as a notch-less slab without it. */}
      <span className="dynamic-island" aria-hidden="true" />

      {/* The whole right cluster is the Control Center handle, as on iOS */}
      <button
        type="button"
        className="status-icons"
        onClick={toggleControlCenter}
        aria-haspopup="dialog"
        aria-label="Control Center"
      >
        {/* Cellular, drawn for the same reason the battery is: iOS never shows
            a status bar without it, and its absence was the sort of gap that is
            invisible until you hold a real phone up beside it. Four bars, all
            full — there is no signal to report, and a phone that draws itself
            with two bars looks broken rather than honest. */}
        <span className="signal" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>

        {wifiEnabled ? <Wifi size={15} /> : <WifiOff size={15} />}
        <span className="battery" aria-hidden="true">
          <span className="level" />
        </span>
      </button>
    </div>
  );
};

export default StatusBar;
