// Server-side only: called from server components with ISR caching.
const PACKAGE = "modelbridge-sdk";
const DAY = 60 * 60 * 24;

export const PYPI_URL = `https://pypi.org/project/${PACKAGE}/`;
/** Live pepy.tech download badge, rendered by shields.io. */
export const DOWNLOADS_BADGE_URL = `https://img.shields.io/pepy/dt/${PACKAGE}?label=downloads&color=0e2a33&labelColor=0b0e14`;

export interface ModelBridgeRelease {
  /** True only when PyPI lists installable files, i.e. `pip install` works. */
  published: boolean;
  version?: string;
  /** All-time downloads as reported by pepy.tech; undefined if the lookup failed. */
  downloads?: number;
  /** First Python example from the published README, if there is one. */
  usageExample?: string;
}

/** Parses shields.io compact numbers such as "638", "1.2k" or "3M". */
function parseCompact(value: string): number | undefined {
  const match = /^([\d.]+)\s*([kKmM])?$/.exec(value.trim());
  if (!match) return undefined;
  const base = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  return Math.round(base * (unit === "k" ? 1e3 : unit === "m" ? 1e6 : 1));
}

async function fetchDownloads(): Promise<number | undefined> {
  try {
    const res = await fetch(`https://img.shields.io/pepy/dt/${PACKAGE}.json`, { next: { revalidate: DAY } });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { value?: string };
    return data.value ? parseCompact(data.value) : undefined;
  } catch {
    return undefined;
  }
}

function firstPythonExample(readme: string | undefined): string | undefined {
  if (!readme) return undefined;
  for (const [, code] of readme.matchAll(/```(?:python|py)\s*\n([\s\S]*?)```/g)) {
    const trimmed = code.trim();
    if (trimmed && !trimmed.startsWith("pip ")) return trimmed.split("\n").slice(0, 18).join("\n");
  }
  return undefined;
}

/**
 * Release status of the ModelBridge SDK, refreshed daily. Falls back to
 * "not published" on any error, so the site never claims a release that
 * `pip install` cannot fetch.
 */
export async function getModelBridgeRelease(): Promise<ModelBridgeRelease> {
  try {
    const res = await fetch(`https://pypi.org/pypi/${PACKAGE}/json`, { next: { revalidate: DAY } });
    if (!res.ok) return { published: false };
    const data = (await res.json()) as {
      info: { version: string; description?: string };
      urls?: unknown[];
    };
    if (!data.urls?.length) return { published: false };
    return {
      published: true,
      version: data.info.version,
      downloads: await fetchDownloads(),
      usageExample: firstPythonExample(data.info.description),
    };
  } catch {
    return { published: false };
  }
}
