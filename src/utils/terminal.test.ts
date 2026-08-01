import { describe, expect, it, vi } from "vitest";

import { techStack } from "#constants/index";
import {
  isClearCommand,
  runCommand,
  type TerminalHandlers,
} from "#utils/terminal";

/**
 * The engine is shared by the desktop window and the phone app, and the two
 * disagree about what opening an app means — so what is worth pinning down here
 * is that a typed line resolves to the right *target* and that nothing with a
 * side effect happens without going through a handler.
 */

const handlers = (): TerminalHandlers => ({ open: vi.fn(), exit: vi.fn() });

const text = (lines: { text: string }[]) => lines.map((line) => line.text);

describe("runCommand", () => {
  it("says nothing about an empty line", () => {
    expect(runCommand("", handlers())).toEqual([]);
    expect(runCommand("   ", handlers())).toEqual([]);
  });

  it("does not care how the command was capitalised or spaced", () => {
    expect(text(runCommand("  HELP  ", handlers()))[0]).toBe(
      "Available commands:"
    );
  });

  it("lists an app for every target it can open", () => {
    const lines = text(runCommand("ls", handlers()));

    expect(lines).toHaveLength(9);
    expect(lines.some((line) => line.startsWith("finder"))).toBe(true);
    expect(lines.some((line) => line.startsWith("trash"))).toBe(true);
  });

  it("prints the stack that constants declares, so the two cannot drift", () => {
    const lines = text(runCommand("stack", handlers()));

    expect(lines).toHaveLength(techStack.length);
    expect(lines[0]).toContain(techStack[0].items[0]);
  });
});

describe("open", () => {
  it("asks the shell to open the app, rather than opening it", () => {
    const shell = handlers();
    const lines = runCommand("open safari", shell);

    expect(shell.open).toHaveBeenCalledExactlyOnceWith("safari");
    expect(lines[0].kind).toBe("output");
  });

  it("resolves the names a visitor would actually type", () => {
    for (const [typed, target] of [
      ["projects", "finder"],
      ["blog", "safari"],
      ["cv", "resume"],
      ["me", "about"],
      ["Gallery", "photos"],
      ["EMAIL", "contact"],
    ]) {
      const shell = handlers();
      runCommand(`open ${typed}`, shell);
      expect(shell.open).toHaveBeenCalledWith(target);
    }
  });

  it("complains without a name, and opens nothing", () => {
    const shell = handlers();
    const [line] = runCommand("open", shell);

    expect(line.kind).toBe("error");
    expect(line.text).toContain("usage");
    expect(shell.open).not.toHaveBeenCalled();
  });

  it("complains about a name it does not know, and opens nothing", () => {
    const shell = handlers();
    const [line] = runCommand("open spotify", shell);

    expect(line.kind).toBe("error");
    expect(line.text).toContain("spotify");
    expect(shell.open).not.toHaveBeenCalled();
  });
});

describe("exit", () => {
  it("leaves closing the terminal to whoever owns the window", () => {
    const shell = handlers();

    expect(runCommand("exit", shell)).toEqual([]);
    expect(shell.exit).toHaveBeenCalledOnce();
  });
});

describe("echo", () => {
  it("prints back exactly what was typed", () => {
    // The `open` argument is lowercased before it is matched; echo must not
    // inherit that
    expect(text(runCommand("echo Hello World", handlers()))).toEqual([
      "Hello World",
    ]);
  });

  it("prints an empty line rather than an error", () => {
    const [line] = runCommand("echo", handlers());

    expect(line.text).toBe("");
    expect(line.kind).toBe("output");
  });
});

describe("unknown commands", () => {
  it("answer the way zsh would, and point at help", () => {
    const [line] = runCommand("vim", handlers());

    expect(line.kind).toBe("error");
    expect(line.text).toContain("vim");
    expect(line.text).toContain("help");
  });

  it("except sudo, which gets what it deserves", () => {
    const [line] = runCommand("sudo rm -rf /", handlers());

    expect(line.kind).toBe("error");
    expect(line.text).toContain("incident");
  });
});

describe("isClearCommand", () => {
  it("recognises clear however it is typed", () => {
    expect(isClearCommand("clear")).toBe(true);
    expect(isClearCommand("  CLEAR  ")).toBe(true);
  });

  it("does not mistake something else for it", () => {
    expect(isClearCommand("clear screen")).toBe(false);
    expect(isClearCommand("")).toBe(false);
  });
});
