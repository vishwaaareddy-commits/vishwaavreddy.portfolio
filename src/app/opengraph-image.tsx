import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Loads one Google font as TTF for the image renderer; returns null if offline. */
async function loadFont(family: string, axis: string, text: string) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axis}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

// Network motif: request → hub → four services → output.
const nodes: [number, number, number][] = [
  [690, 330, 9],
  [800, 315, 16],
  [930, 205, 9],
  [960, 290, 9],
  [935, 375, 9],
  [960, 455, 9],
  [1090, 320, 11],
];
const edges = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 6],
  [3, 6],
  [4, 6],
  [5, 6],
];

const tagline = "LLM tooling, computer vision and automation agents that ship into real businesses.";

export default async function OpengraphImage() {
  const domain = profile.siteUrl.replace("https://", "");
  const sansText = `${profile.name.toUpperCase()}AI Engineer& AI ${tagline}${domain}`;
  // Every string gets an explicit font; otherwise the renderer falls back to
  // whichever font is loaded and serif glyphs leak into the sans text.
  const [serif, sans, sansBold] = await Promise.all([
    loadFont("Instrument+Serif", "ital@1", "Engineer"),
    loadFont("Inter", "wght@400", sansText),
    loadFont("Inter", "wght@700", "AI Engineer& "),
  ]);
  const fonts = [
    ...(sans ? [{ name: "Inter", data: sans, weight: 400 as const, style: "normal" as const }] : []),
    ...(sansBold ? [{ name: "Inter", data: sansBold, weight: 700 as const, style: "normal" as const }] : []),
    ...(serif ? [{ name: "Instrument Serif", data: serif, weight: 400 as const, style: "italic" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "radial-gradient(ellipse at 75% 45%, #0f2a33 0%, #0a1016 45%, #07090d 80%)",
          color: "#eef1f5",
          fontFamily: "Inter",
        }}
      >
        {/* Frame chrome */}
        <div style={{ position: "absolute", top: 22, left: 22, right: 22, bottom: 22, border: "1px solid rgba(148,163,184,0.18)", display: "flex" }} />
        <svg width="1200" height="630" style={{ position: "absolute", top: 0, left: 0 }}>
          {edges.map(([a, b]) => (
            <path
              key={`${a}-${b}`}
              d={`M ${nodes[a][0]} ${nodes[a][1]} C ${(nodes[a][0] + nodes[b][0]) / 2} ${nodes[a][1]}, ${(nodes[a][0] + nodes[b][0]) / 2} ${nodes[b][1]}, ${nodes[b][0]} ${nodes[b][1]}`}
              stroke="#3be3f5"
              strokeOpacity="0.45"
              strokeWidth="2"
              fill="none"
            />
          ))}
          <circle cx="800" cy="315" r="70" fill="#3be3f5" fillOpacity="0.08" />
          <circle cx="800" cy="315" r="38" fill="none" stroke="#3be3f5" strokeOpacity="0.5" />
          {nodes.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#0d1620" stroke="#3be3f5" strokeWidth="2.5" />
          ))}
        </svg>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", width: 640 }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#a3adbb", textTransform: "uppercase" }}>{profile.name}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, fontSize: 80, fontWeight: 700, lineHeight: 1 }}>
            <span>AI Engineer</span>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
              <span>&amp; AI&nbsp;</span>
              <span
                style={{
                  color: "#3be3f5",
                  fontFamily: serif ? "Instrument Serif" : "serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 92,
                }}
              >
                Automation
              </span>
            </div>
          </div>
          <div style={{ fontSize: 26, color: "#a3adbb", marginTop: 26, lineHeight: 1.4 }}>
            {tagline}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 46, left: 72, fontSize: 18, letterSpacing: 2, color: "#6b7686", display: "flex" }}>
          {domain}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length ? fonts : undefined,
    },
  );
}
