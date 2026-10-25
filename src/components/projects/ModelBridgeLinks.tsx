import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { DOWNLOADS_BADGE_URL, PYPI_URL, type ModelBridgeRelease } from "@/lib/pypi";
import { DownloadsCounter } from "./DownloadsCounter";

/** PyPI link, live downloads badge and counter — rendered only once a release installs. */
export function ModelBridgeLinks({ release }: { release: ModelBridgeRelease }) {
  if (!release.published) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-6">
      {release.downloads !== undefined ? (
        <div className="flex flex-col">
          <DownloadsCounter value={release.downloads} />
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">downloads · pepy.tech</span>
        </div>
      ) : null}
      <a href={PYPI_URL} target="_blank" rel="noopener noreferrer" aria-label="PyPI downloads for modelbridge-sdk">
        <Image src={DOWNLOADS_BADGE_URL} alt="PyPI downloads badge" width={120} height={20} unoptimized />
      </a>
      <a
        href={PYPI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink"
      >
        View on PyPI
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </div>
  );
}
