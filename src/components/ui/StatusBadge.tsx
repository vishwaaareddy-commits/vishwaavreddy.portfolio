import type { ProjectStatus } from "@/types/content";

const tone: Record<ProjectStatus, string> = {
  Published: "border-accent/60 bg-accent-dim text-accent",
  Shipped: "border-accent/40 text-accent",
  Delivered: "border-accent/40 text-accent",
  Built: "border-accent/40 text-accent",
  "In development": "border-warn/40 text-warn",
  "Partially implemented": "border-warn/30 text-warn/90",
  "Design / prototype": "border-line-strong text-soft",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider ${tone[status]}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
