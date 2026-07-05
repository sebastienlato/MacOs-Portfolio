import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import WindowWrapper from "#hoc/WindowWrapper";
import WindowControls from "#components/WindowControls";
import { aboutSpecs, dockApps, techStack, locations } from "#constants/index";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import type { WindowKey } from "#types";

interface TerminalLine {
  text: string;
  kind: "input" | "output" | "error";
}

/** Friendly names users might type, mapped to real window keys. */
const OPENABLE: Record<string, WindowKey> = {
  finder: "finder",
  portfolio: "finder",
  projects: "finder",
  safari: "safari",
  articles: "safari",
  blog: "safari",
  photos: "photos",
  gallery: "photos",
  contact: "contact",
  terminal: "terminal",
  settings: "settings",
  about: "about",
  resume: "resume",
};

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

const PROMPT = "sebastien@portfolio ~ %";

const initialLines: TerminalLine[] = [
  {
    text: `Last login: ${new Date().toDateString()} on ttys001`,
    kind: "output",
  },
  { text: "Welcome to Sebastien's portfolio terminal.", kind: "output" },
  { text: "Type 'help' to see what you can do.", kind: "output" },
];

const Terminal = () => {
  const { openWindow, closeWindow } = useWindowStore();
  const { setActiveLocation } = useLocationStore();

  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const print = (
    texts: string[],
    kind: TerminalLine["kind"] = "output"
  ): TerminalLine[] => texts.map((text) => ({ text, kind }));

  const runCommand = (raw: string): TerminalLine[] => {
    const [command = "", ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ").toLowerCase();

    switch (command.toLowerCase()) {
      case "":
        return [];

      case "help":
        return print(HELP_TEXT);

      case "ls":
        return print(
          dockApps.map((app) => `${app.id.padEnd(12)}${app.name}`)
        );

      case "open": {
        if (!arg) return print(["usage: open <app>  (try 'ls')"], "error");
        if (arg === "trash") {
          setActiveLocation(locations.trash);
          openWindow("finder");
          return print(["Opening trash…"]);
        }
        const key = OPENABLE[arg];
        if (!key) return print([`open: no app named '${arg}'`], "error");
        openWindow(key);
        return print([`Opening ${arg}…`]);
      }

      case "stack":
        return print(
          techStack.map(
            ({ category, items }) =>
              `${category.padEnd(12)}${items.join(", ")}`
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
        return print(
          ["Nice try. This incident will be reported 😄"],
          "error"
        );

      case "exit":
        closeWindow("terminal");
        return [];

      default:
        return print(
          [`zsh: command not found: ${command}  (try 'help')`],
          "error"
        );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const raw = input;
    setInput("");
    setHistoryIndex(-1);

    if (raw.trim()) setHistory((prev) => [raw, ...prev]);

    const echoLine: TerminalLine = {
      text: `${PROMPT} ${raw}`,
      kind: "input",
    };

    if (raw.trim().toLowerCase() === "clear") {
      setLines([]);
      return;
    }

    // Run outside the updater: commands have side effects (opening windows)
    const result = runCommand(raw);
    setLines((prev) => [...prev, echoLine, ...result]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      if (history[next] !== undefined) {
        setHistoryIndex(next);
        setInput(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIndex - 1;
      setHistoryIndex(next < 0 ? -1 : next);
      setInput(next < 0 ? "" : (history[next] ?? ""));
    }
  };

  return (
    <>
      <div id="window-header">
        <WindowControls target="terminal" />
        <h2>sebastien — zsh — 80×24</h2>
      </div>

      <div
        className="terminal-screen"
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <p key={i} className={line.kind}>
            {line.text}
          </p>
        ))}

        <form onSubmit={handleSubmit} className="prompt-line">
          <span className="prompt">{PROMPT}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal input"
          />
        </form>
      </div>
    </>
  );
};

const TerminalWindow = WindowWrapper(Terminal, "terminal");

export default TerminalWindow;
