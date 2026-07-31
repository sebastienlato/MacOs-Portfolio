import { useEffect, useRef, useState, type FormEvent } from "react";

import AppFrame from "#mobile/AppFrame";
import { APP_FOR_TARGET } from "#mobile/constants";
import useMobileStore from "#mobile/store";
import { locations } from "#constants/index";
import {
  PROMPT,
  SUGGESTED_COMMANDS,
  initialLines,
  isClearCommand,
  runCommand,
  type TerminalLine,
  type TerminalTarget,
} from "#utils/terminal";

/**
 * The same shell as the desktop window, with one concession to the phone: a row
 * of tappable commands above the keyboard. Nobody is going to type `neofetch`
 * on glass, and the commands are most of what makes the terminal worth keeping.
 */
const TerminalApp = () => {
  const openApp = useMobileStore((state) => state.openApp);
  const dismiss = useMobileStore((state) => state.dismiss);

  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const handlers = {
    open: (target: TerminalTarget) =>
      openApp(APP_FOR_TARGET[target], {
        // `open trash` has no app of its own here, so it opens Files at Trash
        path: target === "trash" ? [locations.trash] : undefined,
      }),
    exit: dismiss,
  };

  const submit = (raw: string) => {
    setInput("");

    if (isClearCommand(raw)) {
      setLines([]);
      return;
    }

    const echoLine: TerminalLine = { text: `${PROMPT} ${raw}`, kind: "input" };
    const result = runCommand(raw, handlers);
    setLines((prev) => [...prev, echoLine, ...result]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <AppFrame title="Terminal">
      <div
        className="terminal-screen mobile"
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
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            enterKeyHint="go"
            aria-label="Terminal input"
          />
        </form>
      </div>

      <div className="command-chips">
        {SUGGESTED_COMMANDS.map((command) => (
          <button key={command} type="button" onClick={() => submit(command)}>
            {command}
          </button>
        ))}
      </div>
    </AppFrame>
  );
};

export default TerminalApp;
