import { ArrowUpRight } from "lucide-react";

import AppFrame from "#mobile/AppFrame";
import { blogPosts } from "#constants/index";

/** The desktop's Safari window, as a reading list. Each post leaves for dev.to. */
const ArticlesApp = () => (
  <AppFrame title="Articles">
    <ul className="article-list">
      {blogPosts.map(({ id, image, title, date, link }) => (
        <li key={id}>
          <a href={link} target="_blank" rel="noopener noreferrer">
            <img src={image} alt="" />

            <div className="body">
              <p className="date">{date}</p>
              <h2>{title}</h2>
              <span className="cta">
                Read on dev.to <ArrowUpRight size={13} />
              </span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  </AppFrame>
);

export default ArticlesApp;
