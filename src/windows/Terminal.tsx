import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import WindowWrapper from "#hoc/WindowWrapper";
import WindowControls from "#components/WindowControls";
import { locations } from "#constants/index";
import useWindowStore from "#store/window";
import useLocationStore from "#store/location";
import {
  PROMPT,
  initialLines,
  isClearCommand,
  runCommand,
  type TerminalLine,
  type TerminalTarget,
} from "#utils/terminal";
import type { WindowKey } from "#types";

/**
 * Every terminal target is a window here except Trash, which macOS opens in the
 * Finder rather than in an app of its own.
 */
const WINDOW_FOR: Record<Exclude<TerminalTarget, "trash">, WindowKey> = {
  finder: "finder",
  safari: "safari",
  photos: "photos",
  contact: "contact",
  resume: "resume",
  terminal: "terminal",
  settings: "settings",
  about: "about",
};

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

  const handlers = {
    open: (target: TerminalTarget) => {
      if (target === "trash") {
        setActiveLocation(locations.trash);
        openWindow("finder");
        return;
      }
      openWindow(WINDOW_FOR[target]);
    },
    exit: () => closeWindow("terminal"),
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const raw = input;
    setInput("");
    setHistoryIndex(-1);

    if (raw.trim()) setHistory((prev) => [raw, ...prev]);

    if (isClearCommand(raw)) {
      setLines([]);
      return;
    }

    const echoLine: TerminalLine = { text: `${PROMPT} ${raw}`, kind: "input" };

    // Run outside the updater: commands have side effects (opening windows)
    const result = runCommand(raw, handlers);
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
