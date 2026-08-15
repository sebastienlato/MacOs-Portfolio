import { aboutSpecs, techStack } from "#constants/index";

/**
 * The shell behind the desktop's terminal window.
 *
 * Everything here is presentation-free: it turns a typed line into lines of
 * output, and asks the caller to perform anything with a side effect. That
 * separation was built when the phone had a terminal too and the two disagreed
 * about what "open safari" *means*; the phone has none now — iOS ships no
 * terminal — but the injection is worth keeping, since it is what lets this be
 * tested without a window to render into. See `terminal.test.ts`.
 */

export type TerminalLineKind = "input" | "output" | "error";

export interface TerminalLine {
  text: string;
  kind: TerminalLineKind;
}

/** Every app the terminal knows how to open, named the same way in both shells. */
export type TerminalTarget =
  | "finder"
  | "safari"
  | "photos"
  | "contact"
  | "resume"
  | "terminal"
  | "settings"
  | "about"
  | "trash";

export interface TerminalHandlers {
  open: (target: TerminalTarget) => void;
  exit: () => void;
}

/** What `ls` prints. The canonical name for each target lives here. */
const APPS: { target: TerminalTarget; name: string }[] = [
  { target: "finder", name: "Portfolio" },
  { target: "safari", name: "Articles" },
  { target: "photos", name: "Gallery" },
  { target: "contact", name: "Contact" },
  { target: "resume", name: "Resume" },
  { target: "terminal", name: "Terminal" },
  { target: "settings", name: "Settings" },
  { target: "about", name: "About" },
  { target: "trash", name: "Trash" },
];

/**
 * Names a visitor might reasonably type, resolved to a target. Every canonical
 * name is its own alias so the table is the single thing `open` consults.
 */
const ALIASES: Record<string, TerminalTarget> = {
  ...Object.fromEntries(APPS.map(({ target }) => [target, target])),
  portfolio: "finder",
  projects: "finder",
  work: "finder",
  files: "finder",
  articles: "safari",
  blog: "safari",
  posts: "safari",
  gallery: "photos",
  pics: "photos",
  cv: "resume",
  me: "about",
  preferences: "settings",
  email: "contact",
};

export const PROMPT = "sebastien@portfolio ~ %";

const HELP_TEXT = [
  "Available commands:",
  "  help              show this help",
  "  ls                list installed apps",
  "  open <app>        open an app (e.g. open safari)",
  "  stack             print my tech stack",
  "  neofetch          system info",
  "  whoami            who is behind this portfolio",
  "  date              current date and time",
  "  echo <text>       print text",
  "  clear             clear the screen",
  "  exit              close the terminal",
];

/** Handy on a phone, where nobody wants to type these out. */
export const SUGGESTED_COMMANDS = [
  "help",
  "whoami",
  "stack",
  "ls",
  "neofetch",
  "open portfolio",
];

export const initialLines = (): TerminalLine[] => [
  {
    text: `Last login: ${new Date().toDateString()} on ttys001`,
    kind: "output",
  },
  { text: "Welcome to Sebastien's portfolio terminal.", kind: "output" },
  { text: "Type 'help' to see what you can do.", kind: "output" },
];

/**
 * `clear` is the one command whose effect is on the transcript itself, which
 * only the component holding that state can do — so it is recognised here and
 * carried out there, rather than being routed through a handler that would then
 * have to undo the echoed prompt line.
 */
export const isClearCommand = (raw: string) =>
  raw.trim().toLowerCase() === "clear";

const print = (
  texts: string[],
  kind: TerminalLineKind = "output"
): TerminalLine[] => texts.map((text) => ({ text, kind }));

export const runCommand = (
  raw: string,
  handlers: TerminalHandlers
): TerminalLine[] => {
  const [command = "", ...args] = raw.trim().split(/\s+/);
  const arg = args.join(" ").toLowerCase();

  switch (command.toLowerCase()) {
    case "":
      return [];

    case "help":
      return print(HELP_TEXT);

    case "ls":
      return print(APPS.map(({ target, name }) => `${target.padEnd(12)}${name}`));

    case "open": {
      if (!arg) return print(["usage: open <app>  (try 'ls')"], "error");

      const target = ALIASES[arg];
      if (!target) return print([`open: no app named '${arg}'`], "error");

      handlers.open(target);
      return print([`Opening ${arg}…`]);
    }

    case "stack":
      return print(
        techStack.map(
          ({ category, items }) => `${category.padEnd(12)}${items.join(", ")}`
        )
      );

    case "neofetch":
      return print([
        "            ,--.       sebastien@portfolio",
        "           |oo  )      -------------------",
        "  _.------._  /        OS: portfolioOS 1.0",
        " (          `-.        Host: MacBook Pro (Portfolio Edition)",
        "  \\            \\       Shell: zsh (pretend)",
        "   \\    (o)  (o)       Uptime: since you opened this tab",
        ...aboutSpecs.map(
          ({ label, value }) => `                       ${label}: ${value}`
        ),
      ]);

    case "whoami":
      return print([
        "Sebastien Lato — mobile & web developer.",
        "Swift / SwiftUI / React / Next.js / TypeScript.",
      ]);

    case "date":
      return print([new Date().toString()]);

    case "echo":
      return print([args.join(" ")]);

    case "sudo":
      return print(["Nice try. This incident will be reported 😄"], "error");

    case "exit":
      handlers.exit();
      return [];

    default:
      return print(
        [`zsh: command not found: ${command}  (try 'help')`],
        "error"
      );
  }
};
