"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copy-to-clipboard button for a shell command shown beside it. */
export function CopyButton({ command }: { command: string }) {
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
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy “${command}”`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[0.65rem] text-soft transition-colors hover:border-accent/50 hover:text-accent"
    >
      {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
