import AppFrame from "#mobile/AppFrame";
import { aboutSpecs } from "#constants/index";
import useMobileStore from "#mobile/store";

/** The desktop's "About This Mac", reading as an iOS Settings ▸ About pane. */
const AboutApp = () => {
  const openApp = useMobileStore((state) => state.openApp);

  return (
    <AppFrame title="About This Device">
      <div className="about-hero">
        <img src="/macbook.png" alt="" />
        <h2>MacBook Pro</h2>
        <p>Sebastien&apos;s Portfolio Edition, 2026</p>
      </div>

      <ul className="spec-list">
        {aboutSpecs.map(({ label, value }) => (
          <li key={label}>
            <span className="label">{label}</span>
            <span className="value">{value}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="wide-button"
        onClick={() => openApp("resume")}
      >
        More Info…
      </button>
    </AppFrame>
  );
};

export default AboutApp;
