"use client";

import { CaseNotes } from "@/components/projects/CaseNotes";
import { OcrDemo } from "@/components/projects/OcrDemo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useScene3D } from "@/hooks/useScene3D";
import { gsap } from "@/lib/gsap";
import { labelRegistry } from "@/store/journey";
import type { CaseStudy } from "@/types/content";
import { Chapter } from "../Chapter";

// Fictional, clearly example data — not real players or matches.
const ROWS = [
  { raw: "ᴘʟᴀʏᴇʀ·ᴀʟᴘʜᴀ", player: "PlayerAlpha", opponent: "PlayerBravo" },
  { raw: "ꜱᴀᴍᴘʟᴇ⚡ᴛᴀɢ", player: "SampleTag", opponent: "DemoName" },
  { raw: "ᴅᴇᴍᴏ·ɴᴀᴍᴇ", player: "DemoName", opponent: "PlayerAlpha" },
];

/** When each row's tag lands (chapter progress); matches OCR_TIMELINE.fly in the scene. */
const landAt = (i: number) => 0.8 + i * 0.05;

/**
 * Chapter 04, CNN feature maps. The game frame enters as an input plane,
 * a scan line passes, four conv planes light up with feature maps computed
 * from the frame, boxes snap onto the kill feed and the names fly into the
 * table. Reduced motion and no-WebGL get the CSS step-through instead.
 */
export function OcrChapter({ study }: { study: CaseStudy }) {
  const { scene3D } = useScene3D();

  return (
    <>
      {/* Remount when the 3D decision resolves after hydration, so the timeline sees the table rows. */}
      <Chapter
        key={scene3D ? "3d" : "css"}
        index={4}
        id="esports-ocr"
        pin
        pinOnMobile={false}
        unpinnedRange={["top 80%", "bottom 80%"]}
        length={0.7}
        aria-labelledby="esports-ocr-title"
        className="flex min-h-[100svh] items-center py-24 md:py-0"
        build={(tl, { root }) => {
          const rows = gsap.utils.toArray<HTMLElement>("[data-ocr-row]", root);
          if (!rows.length) return;
          // Rows wait dimmed (never below 0.4) until their tag lands.
          gsap.set(rows, { opacity: 0.4 });
          rows.forEach((row, i) => tl.to(row, { opacity: 1, duration: 0.04 }, landAt(i)));
          tl.to({}, { duration: 1 }, 0);
        }}
      >
        <div className="shell relative z-10 grid w-full grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10">
          <div data-copy className="md:col-span-5">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">004</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
              {study.kicker} · {study.org}
            </p>
            <h2 id="esports-ocr-title" className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              BGMI esports <span className="font-serif text-[1.1em] font-normal italic text-accent">OCR</span>
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={study.status} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-faint">{study.statusNote}</p>
            <p className="mt-4 max-w-md leading-relaxed text-soft">{study.problem}</p>
            <CaseNotes study={study} />
          </div>

          <div className="md:col-span-7">
            {scene3D ? (
              <>
                {/* Empty stage the 3D input frame and conv planes are fitted to. */}
                <p className="mb-2 font-mono text-[0.62rem] text-faint">
                  illustrative feature maps · fixed kernels on this frame · the real pipeline is OpenCV + PaddleOCR
                </p>
                <div
                  data-stage="ocr"
                  data-copy
                  role="img"
                  aria-label="A game frame as the input plane, a scan line, then four convolution-layer planes showing feature maps computed from the frame with edge and blur kernels; boxes snap onto the kill feed and the names fly into the table."
                  className="relative aspect-video w-full"
                />
                <table data-copy className="mt-4 w-full font-mono text-[0.72rem]">
                  <caption className="mb-2 text-left text-[0.62rem] uppercase tracking-wider text-faint">
                    Structured result (example data)
                  </caption>
                  <thead>
                    <tr className="text-left text-faint">
                      <th className="py-1.5 pr-3 font-normal">Read as</th>
                      <th className="py-1.5 pr-3 font-normal">Player</th>
                      <th className="py-1.5 pr-3 font-normal">Opponent</th>
                      <th className="py-1.5 font-normal">Finishes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.player} data-ocr-row className="border-t border-line text-soft">
                        <td className="py-2 pr-3">{row.raw}</td>
                        <td className="py-2 pr-3 text-fg">{row.player}</td>
                        <td className="py-2 pr-3">{row.opponent}</td>
                        <td className="py-2 text-warn/90">pairing in progress</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <OcrDemo />
            )}
          </div>
        </div>
      </Chapter>

      {/* Name tags in flight: real HTML, positioned each frame by the canvas. */}
      {scene3D ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[5]">
          {ROWS.map((row, i) => (
            <span
              key={row.player}
              ref={(el) => {
                if (el) labelRegistry.set(`ocr-tag-${i}`, el);
                else labelRegistry.delete(`ocr-tag-${i}`);
              }}
              style={{ display: "none" }}
              className="absolute left-0 top-0 whitespace-nowrap rounded border border-accent/60 bg-ink/85 px-2 py-0.5 font-mono text-[0.66rem] text-accent"
            >
              {row.raw}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
