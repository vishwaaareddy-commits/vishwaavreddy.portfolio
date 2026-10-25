"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A shell command with a copy-to-clipboard button. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the command stays selectable.
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="select-all text-fg">
        <span className="select-none text-accent">$ </span>
        {command}
      </p>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : `Copy “${command}”`}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[0.65rem] text-soft transition-colors hover:border-accent/50 hover:text-accent"
      >
        {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
