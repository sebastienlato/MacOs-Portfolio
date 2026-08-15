import ItemIcon from "#components/ItemIcon";
import { locations } from "#constants/index";
import useMobileStore from "#mobile/store";

const projects = locations.work.children ?? [];

/**
 * A Home Screen widget, holding the thing the whole site is about.
 *
 * The Home Screen used to run two rows of icons and then most of a screen of
 * wallpaper before the dock, with the greeting adrift in the middle of it. iOS
 * fills that space with widgets, and a portfolio has the obvious candidate: the
 * work. Each tile opens Files already drilled into that project, so the widget
 * is a shortcut rather than a picture of one.
 */
const ProjectsWidget = () => {
  const openApp = useMobileStore((state) => state.openApp);

  if (projects.length === 0) return null;

  return (
    <section className="ios-widget" aria-labelledby="widget-projects">
      <header>
        <h2 id="widget-projects">Projects</h2>
        <p>{projects.length} in Work</p>
      </header>

      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() =>
                openApp("files", { path: [locations.work, project] })
              }
            >
              <ItemIcon item={project} />
              <span className="truncate">{project.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProjectsWidget;
