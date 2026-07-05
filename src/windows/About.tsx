import WindowWrapper from "#hoc/WindowWrapper";
import { WindowControls } from "#components";
import { aboutSpecs } from "#constants/index";
import useWindowStore from "#store/window";

const About = () => {
  const { openWindow } = useWindowStore();

  return (
    <>
      <div id="window-header">
        <WindowControls target="about" />
        <h2>About This Mac</h2>
      </div>

      <div className="about-content">
        <img src="/macbook.png" alt="MacBook" />

        <h3>MacBook Pro</h3>
        <p className="subtitle">Sebastien&apos;s Portfolio Edition, 2026</p>

        <ul>
          {aboutSpecs.map(({ label, value }) => (
            <li key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => openWindow("resume")}>
          More Info…
        </button>
      </div>
    </>
  );
};

const AboutWindow = WindowWrapper(About, "about");

export default AboutWindow;
