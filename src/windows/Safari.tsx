import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoveRight,
  PanelLeft,
  Plus,
  Search,
  Share,
  ShieldHalf,
} from "lucide-react";
import { blogPosts } from "#constants/index";

const Safari = () => {
  return (
    <>
      {/*
        The toolbar sheds its groups as the window narrows, the way Safari's
        does, and the address field is the last thing standing. Which groups
        are still there is decided in CSS, from the width of the window rather
        than of the screen — see the container queries on #safari.
      */}
      <div id="window-header">
        <WindowControls target="safari" />

        <div className="toolbar-nav">
          <PanelLeft className="icon" />
          <ChevronLeft className="icon" />
          <ChevronRight className="icon" />
        </div>

        <div className="address">
          <ShieldHalf className="icon" />

          <div className="search">
            <Search className="icon" />

            <input type="text" placeholder="Search or enter website name" />
          </div>
        </div>

        <div className="toolbar-actions">
          <Share className="icon" />
          <Plus className="icon" />
          <Copy className="icon" />
        </div>
      </div>

      <div className="blog">
        <h2>My Developer Blog</h2>

        <div className="space-y-8">
          {blogPosts.map(({ id, image, title, date, link }) => (
            <div key={id} className="blog-post">
              <div className="col-span-2">
                <img src={image} alt={title} />
              </div>

              <div className="content">
                <p>{date}</p>
                <h3>{title}</h3>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  Check out the full post <MoveRight className="icon-hover" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const SafariWindow = WindowWrapper(Safari, "safari");

export default SafariWindow;
