import { describe, expect, it } from "vitest";

import { displayUrl, embeddable, refusesFraming, resolveInput } from "#utils/browser";

describe("resolveInput", () => {
  it("visits what is shaped like an address", () => {
    expect(resolveInput("react.dev")).toBe("https://react.dev");
    expect(resolveInput("en.wikipedia.org/wiki/MacOS")).toBe(
      "https://en.wikipedia.org/wiki/MacOS"
    );
    expect(resolveInput("  http://example.com  ")).toBe("http://example.com");
    expect(resolveInput("localhost:5173")).toBe("http://localhost:5173");
  });

  it("searches for everything else", () => {
    expect(resolveInput("react dev")).toBe(
      "https://www.google.com/search?igu=1&q=react%20dev"
    );
    expect(resolveInput("swiftui")).toBe(
      "https://www.google.com/search?igu=1&q=swiftui"
    );
    // A dot inside a sentence does not make it a host
    expect(resolveInput("version 2.0")).toMatch(/^https:\/\/www\.google\.com\/search/);
  });

  it("ignores an empty field", () => {
    expect(resolveInput("   ")).toBeNull();
  });
});

describe("embeddable", () => {
  it("routes Google to the pages it lets be framed", () => {
    expect(embeddable("https://www.google.com/")).toBe(
      "https://www.google.com/webhp?igu=1"
    );
    expect(embeddable("https://www.google.com/search?q=gsap")).toBe(
      "https://www.google.com/search?igu=1&q=gsap"
    );
  });

  it("turns a YouTube video into its embed", () => {
    expect(embeddable("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
    expect(embeddable("https://youtu.be/abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("leaves everything else alone", () => {
    expect(embeddable("https://react.dev/learn")).toBe("https://react.dev/learn");
  });
});

describe("refusesFraming", () => {
  it("knows the sites that refuse, subdomains included", () => {
    expect(refusesFraming("https://github.com/sebastienlato")).toBe(true);
    expect(refusesFraming("https://gist.github.com/x")).toBe(true);
    expect(refusesFraming("https://www.linkedin.com/in/someone")).toBe(true);
    expect(refusesFraming("https://www.google.com/maps")).toBe(true);
  });

  it("lets through the framable forms of Google and YouTube", () => {
    expect(refusesFraming("https://www.google.com/search?igu=1&q=x")).toBe(false);
    expect(refusesFraming("https://www.youtube.com/embed/abc")).toBe(false);
  });

  it("does not mistake a lookalike for a listed host", () => {
    expect(refusesFraming("https://notgithub.com")).toBe(false);
    expect(refusesFraming("https://en.wikipedia.org/wiki/MacOS")).toBe(false);
  });
});

describe("displayUrl", () => {
  it("shows the host, or the words searched for", () => {
    expect(displayUrl("https://www.wikipedia.org/wiki/X")).toBe("wikipedia.org");
    expect(displayUrl("https://www.google.com/search?igu=1&q=react%20dev")).toBe(
      "react dev"
    );
  });
});
