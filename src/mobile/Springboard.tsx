import { DOCK_APPS, GRID_APPS, HOME_LINKS } from "#mobile/constants";
import { AppIcon, LinkIcon } from "#mobile/AppIcon";

/**
 * The Home Screen: one page of apps, the greeting, and the dock. There is no
 * second page and so no page dots — iOS only draws them once there is somewhere
 * to swipe to.
 *
 * The greeting is written first and moved below the grid with flex `order`.
 * Icons belong directly under the status bar, the way a real Home Screen fills
 * from the top; the heading still wants to be the first thing read.
 */
const Springboard = () => (
  <div className="springboard">
    <header className="greeting">
      <p>Hey, I&apos;m Sebastien! Welcome to my</p>
      <h1>portfolio</h1>
    </header>

    <ul className="app-grid">
      {GRID_APPS.map((app) => (
        <AppIcon key={app.id} app={app} />
      ))}

      {HOME_LINKS.map((link) => (
        <LinkIcon key={link.id} link={link} />
      ))}
    </ul>

    <nav className="ios-dock" aria-label="Dock">
      <ul>
        {DOCK_APPS.map((app) => (
          <AppIcon key={app.id} app={app} showLabel={false} />
        ))}
      </ul>
    </nav>
  </div>
);

export default Springboard;
