import type { Plugin } from "vite";

import {
  blogPosts,
  locations,
  socials,
  techStack,
} from "../src/constants/index";
import type { FinderItem } from "../src/types";

/**
 * Everything a crawler can read.
 *
 * The desktop puts its content inside windows, and a window that has not been
 * opened is not in the DOM — so a crawler arriving here found a hero, a dock,
 * and no prose at all. This writes the substance into index.html at build time:
 * structured data in the head, and a plain readable page in a <noscript> for
 * anything that does not run JavaScript, which is also what a visitor with
 * scripts turned off deserves to get.
 *
 * All of it is generated from `src/constants`, so it cannot drift from what the
 * app itself shows.
 */

const SITE = "https://sebastienlato.com";
const NAME = "Sebastien Lato";
const ROLE = "Mobile & Web Developer";
const EMAIL = "contact@latodev.pro";

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The prose a folder carries, which lives in the .txt file inside it. */
const readme = (folder: FinderItem) =>
  (folder.children ?? []).find((child) => child.fileType === "txt");

/** Where a project's code lives, from the .url file beside its notes. */
const repo = (folder: FinderItem) =>
  (folder.children ?? []).find((child) => child.fileType === "url")?.href;

const projects = locations.work.children ?? [];
const about = readme(locations.about);

const structuredData = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: NAME,
      url: SITE,
      email: `mailto:${EMAIL}`,
      jobTitle: ROLE,
      description: about?.description?.[0],
      knowsAbout: techStack.flatMap((entry) => entry.items),
      // sameAs is for profiles *elsewhere*; this site is already `url`
      sameAs: socials
        .map((social) => social.link)
        .filter((link) => !link.startsWith(SITE)),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: `${NAME} — Portfolio`,
      inLanguage: "en",
      author: { "@id": `${SITE}/#person` },
    },
    ...projects.map((project) => ({
      "@type": "SoftwareApplication",
      name: project.name,
      applicationCategory: "MobileApplication",
      description: readme(project)?.description?.join(" "),
      url: repo(project),
      author: { "@id": `${SITE}/#person` },
    })),
  ],
});

const fallbackPage = () => `
<noscript>
  <style>
    .no-js { max-width: 42rem; margin: 0 auto; padding: 3rem 1.25rem; color: #111;
             font: 16px/1.6 system-ui, -apple-system, sans-serif; background: #fff; }
    .no-js h1 { font-size: 2rem; margin: 0 0 .25rem; }
    .no-js h2 { font-size: 1.15rem; margin: 2.5rem 0 .5rem; }
    .no-js h3 { font-size: 1rem; margin: 1.5rem 0 .25rem; }
    .no-js .role { color: #555; margin: 0 0 2rem; }
    .no-js ul { padding-left: 1.1rem; }
  </style>

  <main class="no-js">
    <h1>${escape(NAME)}</h1>
    <p class="role">${escape(ROLE)}</p>

    ${(about?.description ?? []).map((line) => `<p>${escape(line)}</p>`).join("\n    ")}

    <h2>Projects</h2>
    ${projects
      .map((project) => {
        // A project's notes are one sentence wrapped across array entries —
        // rendering each as its own paragraph breaks them mid-clause. The bio
        // above is the other shape: those entries really are paragraphs.
        const notes = (readme(project)?.description ?? []).join(" ");
        const href = repo(project);
        return `<h3>${escape(project.name)}</h3>
    <p>${escape(notes)}</p>
    ${href ? `<p><a href="${escape(href)}">${escape(href)}</a></p>` : ""}`;
      })
      .join("\n    ")}

    <h2>Writing</h2>
    <ul>
      ${blogPosts
        .map(
          (post) =>
            `<li><a href="${escape(post.link)}">${escape(post.title)}</a> — ${escape(post.date)}</li>`
        )
        .join("\n      ")}
    </ul>

    <h2>Stack</h2>
    <ul>
      ${techStack
        .map(
          (entry) =>
            `<li><strong>${escape(entry.category)}:</strong> ${escape(entry.items.join(", "))}</li>`
        )
        .join("\n      ")}
    </ul>

    <h2>Contact</h2>
    <ul>
      <li><a href="mailto:${escape(EMAIL)}">${escape(EMAIL)}</a></li>
      ${socials
        .map(
          (social) =>
            `<li><a href="${escape(social.link)}">${escape(social.text)}</a></li>`
        )
        .join("\n      ")}
      <li><a href="/files/resume.pdf">Résumé (PDF)</a></li>
    </ul>

    <p>This portfolio is an interactive macOS desktop, and needs JavaScript to run.</p>
  </main>
</noscript>`;

/**
 * One entry, deliberately.
 *
 * A window's address is a fragment — `#/work/securevault` — and a fragment is
 * not a document to a crawler; every one of them resolves to this same page.
 * Listing them would be padding a sitemap with duplicates of the root. Making
 * them genuinely indexable means real paths *and* prerendered HTML per route,
 * which is a different piece of work.
 */
const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
`;

const seo = (): Plugin => ({
  name: "portfolio-seo",

  transformIndexHtml: {
    order: "pre",
    handler: (html) =>
      html
        .replace(
          "</head>",
          `  <script type="application/ld+json">${JSON.stringify(structuredData())}</script>\n  </head>`
        )
        .replace("</body>", `${fallbackPage()}\n  </body>`),
  },

  generateBundle() {
    this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap() });
  },
});

export default seo;
