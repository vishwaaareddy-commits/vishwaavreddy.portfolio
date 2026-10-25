import Image from "next/image";
import media from "@/data/media.generated.json";

// Dark gradient shown, blurred, while the real image loads.
const BLUR = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><radialGradient id="g" cx="60%" cy="40%"><stop offset="0" stop-color="#123a44"/><stop offset="1" stop-color="#07090d"/></radialGradient></defs><rect width="16" height="9" fill="url(#g)"/></svg>`,
)}`;

const present = new Set<string>(media.present);

export function hasMedia(src: string) {
  return present.has(src);
}

interface MediaFrameProps {
  src: string;
  alt: string;
  /** Shown on the generated fallback when the file is not there yet. */
  label: string;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Image slot with a blur placeholder. If the asset has not been added to
 * /public yet, renders a designed panel instead of a broken image.
 */
export function MediaFrame({
  src,
  alt,
  label,
  aspect = "16 / 9",
  sizes = "(min-width: 1024px) 58vw, 100vw",
  priority,
  className = "",
}: MediaFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-ink-2 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {present.has(src) ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={BLUR}
          unoptimized={src.endsWith(".gif")}
          className="object-cover"
        />
      ) : (
        <div aria-hidden className="absolute inset-0">
          <div className="hairline-grid absolute inset-0 opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_35%,rgba(59,227,245,0.12),transparent_60%)]" />
          {["left-3 top-3 border-l border-t", "right-3 top-3 border-r border-t", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map(
            (corner) => (
              <span key={corner} className={`absolute size-4 border-accent/60 ${corner}`} />
            ),
          )}
          <p className="absolute bottom-5 left-6 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
            {label}
          </p>
        </div>
      )}
    </div>
  );
}
