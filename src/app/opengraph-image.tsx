import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const nodes = [
  [120, 330],
  [330, 300],
  [600, 170],
  [640, 300],
  [590, 430],
  [920, 310],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: "#07090d",
          color: "#eef1f5",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="1200" height="630" style={{ position: "absolute", top: 0, left: 0, opacity: 0.55 }}>
          {[
            [0, 1],
            [1, 2],
            [1, 3],
            [1, 4],
            [2, 5],
            [3, 5],
            [4, 5],
          ].map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={nodes[a][0] + 160}
              y1={nodes[a][1] - 140}
              x2={nodes[b][0] + 160}
              y2={nodes[b][1] - 140}
              stroke="#3be3f5"
              strokeOpacity="0.35"
              strokeWidth="2"
            />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x + 160} cy={y - 140} r={i === 1 ? 12 : 8} fill="#3be3f5" />
          ))}
        </svg>
        <div style={{ fontSize: 26, letterSpacing: 6, color: "#3be3f5", textTransform: "uppercase" }}>
          {profile.title}
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 12 }}>{profile.name}</div>
        <div style={{ fontSize: 30, color: "#a3adbb", marginTop: 16, maxWidth: 900 }}>
          LLM tooling, computer vision and automation agents that ship into real businesses.
        </div>
      </div>
    ),
    size,
  );
}
