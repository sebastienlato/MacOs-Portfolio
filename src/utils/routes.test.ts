import { describe, expect, it } from "vitest";

import { locations } from "#constants/index";
import type { FinderItem } from "#types";
import {
  fileOf,
  folderOf,
  hashForState,
  parseRoute,
  routeToHash,
  slug,
} from "#utils/routes";

/**
 * These addresses are shared. A link someone pasted into a message a year ago
 * has to keep landing where it did, so the literal hashes below are asserted on
 * purpose: renaming a folder in `constants` should fail here loudly rather than
 * break a URL in silence. If one of them fails because the content moved
 * deliberately, that is the moment to decide whether the old URL needs a home.
 */

const { work, about, resume, trash } = locations;

const child = (parent: FinderItem, name: string) => {
  const found = (parent.children ?? []).find((item) => item.name === name);
  if (!found) throw new Error(`${parent.name} has no child named ${name}`);
  return found;
};

const secureVault = child(work, "SecureVault");
const secureVaultTxt = child(secureVault, "SecureVault Project.txt");
const secureVaultPng = child(secureVault, "securevault.png");
const resumePdf = child(resume, "Resume.pdf");

/** Every folder and file the route table can reach, flattened. */
const walk = (item: FinderItem): FinderItem[] => [
  item,
  ...(item.children ?? []).flatMap(walk),
];

describe("slug", () => {
  it("lowercases and joins on a single dash", () => {
    expect(slug("SecureVault Project.txt")).toBe("securevault-project-txt");
    expect(slug("About me")).toBe("about-me");
  });

  it("drops leading and trailing punctuation rather than keeping empty edges", () => {
    expect(slug("  .Hello, World!  ")).toBe("hello-world");
  });

  it("survives a name that is punctuation alone", () => {
    expect(slug("…")).toBe("");
  });
});

describe("parseRoute", () => {
  it("treats the bare desktop as no route at all", () => {
    expect(parseRoute("#/")).toBeNull();
    expect(parseRoute("#")).toBeNull();
    expect(parseRoute("")).toBeNull();
  });

  it("refuses a first segment that names nothing", () => {
    expect(parseRoute("#/nonsense")).toBeNull();
    expect(parseRoute("#/nonsense/deeper/still")).toBeNull();
  });

  it("opens a window that is only itself", () => {
    expect(parseRoute("#/articles")).toEqual({ window: "safari", path: [] });
    expect(parseRoute("#/gallery")).toEqual({ window: "photos", path: [] });
    expect(parseRoute("#/this-mac")).toEqual({ window: "about", path: [] });
    expect(parseRoute("#/resume")).toEqual({ window: "resume", path: [] });
  });

  it("walks a Finder path down from a root", () => {
    expect(parseRoute("#/work")).toEqual({ window: "finder", path: [work] });
    expect(parseRoute("#/about-me")).toEqual({ window: "finder", path: [about] });
    expect(parseRoute("#/trash")).toEqual({ window: "finder", path: [trash] });
    expect(parseRoute("#/work/securevault")).toEqual({
      window: "finder",
      path: [work, secureVault],
    });
  });

  it("opens a file in the window that file belongs to", () => {
    expect(parseRoute("#/work/securevault/securevault-project-txt")).toEqual({
      window: "txtfile",
      path: [work, secureVault, secureVaultTxt],
    });
    expect(parseRoute("#/work/securevault/securevault-png")).toEqual({
      window: "imgfile",
      path: [work, secureVault, secureVaultPng],
    });
  });

  it("stops at the folder for a file that is really a link", () => {
    // .url and .fig open elsewhere entirely, so the deepest thing this URL can
    // describe is the folder holding them
    expect(parseRoute("#/work/securevault/securevault-com")).toEqual({
      window: "finder",
      path: [work, secureVault],
    });
    expect(parseRoute("#/work/securevault/design-fig")).toEqual({
      window: "finder",
      path: [work, secureVault],
    });
  });

  it("falls back to the nearest real folder when the tail is stale", () => {
    expect(parseRoute("#/work/securevault/gone")).toEqual({
      window: "finder",
      path: [work, secureVault],
    });
    expect(parseRoute("#/work/gone/deeper")).toEqual({
      window: "finder",
      path: [work],
    });
  });

  it("reads a hash however it was typed or encoded", () => {
    const expected = { window: "finder", path: [work, secureVault] };

    expect(parseRoute("#/Work/SecureVault")).toEqual(expected);
    expect(parseRoute("#/work/securevault/")).toEqual(expected);
    expect(parseRoute("work/securevault")).toEqual(expected);
    expect(parseRoute("#/About%20me")).toEqual({
      window: "finder",
      path: [about],
    });
  });
});

describe("routeToHash", () => {
  it("names a standalone window by its app segment", () => {
    expect(routeToHash({ window: "safari", path: [] })).toBe("#/articles");
    expect(routeToHash({ window: "settings", path: [] })).toBe("#/settings");
  });

  it("sends a window with no address of its own to the desktop", () => {
    expect(routeToHash({ window: "finder", path: [] })).toBe("#/");
    expect(routeToHash({ window: "txtfile", path: [] })).toBe("#/");
  });

  it("joins a Finder path segment by segment", () => {
    expect(routeToHash({ window: "finder", path: [work, secureVault] })).toBe(
      "#/work/securevault"
    );
    expect(
      routeToHash({
        window: "txtfile",
        path: [work, secureVault, secureVaultTxt],
      })
    ).toBe("#/work/securevault/securevault-project-txt");
  });

  it("shortens the one PDF to the app that shows it", () => {
    expect(routeToHash({ window: "resume", path: [resume, resumePdf] })).toBe(
      "#/resume"
    );
  });
});

describe("round trips", () => {
  it("returns every folder and openable file to the hash it came from", () => {
    const addressable = [work, about, trash]
      .flatMap(walk)
      // A .url or .fig opens somewhere off the desktop entirely, so it has no
      // address of its own to come back to
      .filter((item) => !["url", "fig"].includes(item.fileType ?? ""));

    // The whole tree, not a sample: a project added to constants tomorrow is
    // covered by this the moment it is added
    expect(addressable.length).toBeGreaterThan(10);

    for (const item of addressable) {
      const hash = hashFor(item);
      expect(routeToHash(parseRoute(hash)!)).toBe(hash);
    }
  });

  it("returns every standalone app to its own hash", () => {
    for (const hash of [
      "#/articles",
      "#/gallery",
      "#/contact",
      "#/terminal",
      "#/resume",
      "#/settings",
      "#/this-mac",
    ]) {
      expect(routeToHash(parseRoute(hash)!)).toBe(hash);
    }
  });
});

/** The hash a tree item ought to have, built the long way round for the test. */
const hashFor = (item: FinderItem): string => {
  for (const root of [work, about, trash]) {
    if (root === item) return `#/${slug(root.name)}`;

    for (const folder of root.children ?? []) {
      if (folder === item) return `#/${slug(root.name)}/${slug(folder.name)}`;

      for (const file of folder.children ?? []) {
        if (file === item) {
          return `#/${slug(root.name)}/${slug(folder.name)}/${slug(file.name)}`;
        }
      }
    }
  }

  throw new Error(`${item.name} is not in the tree`);
};

describe("folderOf and fileOf", () => {
  it("finds the deepest folder, whatever is below it", () => {
    expect(folderOf([work, secureVault, secureVaultTxt])).toBe(secureVault);
    expect(folderOf([work])).toBe(work);
    expect(folderOf([])).toBeUndefined();
  });

  it("only calls the last item a file when it actually is one", () => {
    expect(fileOf([work, secureVault, secureVaultPng])).toBe(secureVaultPng);
    expect(fileOf([work, secureVault])).toBeUndefined();
    expect(fileOf([])).toBeUndefined();
  });
});

describe("hashForState", () => {
  it("describes an empty desktop", () => {
    expect(hashForState(null, work, null)).toBe("#/");
  });

  it("describes Finder by where it is standing", () => {
    expect(hashForState("finder", work, null)).toBe("#/work");
    expect(hashForState("finder", secureVault, null)).toBe(
      "#/work/securevault"
    );
    expect(hashForState("finder", about, null)).toBe("#/about-me");
  });

  it("describes a file window by the file it is showing", () => {
    expect(hashForState("txtfile", work, secureVaultTxt)).toBe(
      "#/work/securevault/securevault-project-txt"
    );
    expect(hashForState("imgfile", work, secureVaultPng)).toBe(
      "#/work/securevault/securevault-png"
    );
  });

  it("falls back to the desktop rather than inventing an address", () => {
    // A file window with nothing in it, and a location outside the three
    // roots — Resume is reached as an app, not as a folder
    expect(hashForState("txtfile", work, null)).toBe("#/");
    expect(hashForState("finder", resume, null)).toBe("#/");
  });

  it("describes a standalone window by its app segment", () => {
    expect(hashForState("safari", work, null)).toBe("#/articles");
    expect(hashForState("terminal", work, null)).toBe("#/terminal");
  });
});
