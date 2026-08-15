import { useState } from "react";
import { Search } from "lucide-react";

import { DOCK_APPS, GRID_APPS, HOME_LINKS } from "#mobile/constants";
import { AppIcon, LinkIcon } from "#mobile/AppIcon";
import ProjectsWidget from "#mobile/ProjectsWidget";
import SearchSheet from "#mobile/SearchSheet";

/**
 * The Home Screen: a page of apps, a widget, the greeting, the search pill and
 * the dock. There is no second page and so no page dots — iOS only draws them
 * once there is somewhere to swipe to.
 *
 * The greeting is written first and moved below the grid with flex `order`.
 * Icons belong directly under the status bar, the way a real Home Screen fills
 * from the top; the heading still wants to be the first thing read.
 */
const Springboard = () => {
  const [searching, setSearching] = useState(false);

  return (
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

      <ProjectsWidget />

      {/* The pill iOS puts above the dock. It sits after the greeting in the
          flow so the greeting keeps the space that stretches. */}
      <button
        type="button"
        className="search-pill"
        onClick={() => setSearching(true)}
      >
        <Search size={14} aria-hidden="true" />
        Search
      </button>

      <nav className="ios-dock" aria-label="Dock">
        <ul>
          {DOCK_APPS.map((app) => (
            <AppIcon key={app.id} app={app} showLabel={false} />
          ))}
        </ul>
      </nav>

      {searching && <SearchSheet close={() => setSearching(false)} />}
    </div>
  );
};

export default Springboard;
