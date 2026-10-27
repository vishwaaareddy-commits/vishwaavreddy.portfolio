import type { FlowEdge, FlowNode } from "@/components/journey/canvas/scenes/FlowGraph";

/**
 * Chapter 05: the 12 app pages that were tested (numbered, not named: the
 * app is confidential — only the glucose log is named, as the finding),
 * plus the report. Agents walk TOUR; the glucose log turns red on arrival.
 */
const COLS = [-2.1, -0.7, 0.7, 2.1];
const ROWS = [0.85, 0, -0.85];
const pages: FlowNode[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1).padStart(2, "0"),
  pos: [COLS[i % 4], ROWS[Math.floor(i / 4)]] as [number, number],
  on: 0,
}));
const GLUCOSE = 6;
pages[GLUCOSE] = { ...pages[GLUCOSE], id: "glucose", alert: true };
const TOUR = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11];
const WALK = { from: 0.1, to: 0.68 };
const leg = (WALK.to - WALK.from) / (TOUR.length - 1);
TOUR.forEach((n, k) => (pages[n].on = WALK.from + k * leg));
const REPORT = 12;
export const QA_NODES: FlowNode[] = [...pages, { id: "report", pos: [3.3, 0], on: 0.86, hub: true }];
export const QA_EDGES: FlowEdge[] = [
  ...TOUR.slice(0, -1).map((a, k) => ({ a, b: TOUR[k + 1], from: WALK.from + k * leg, to: WALK.from + (k + 1) * leg })),
  // Cross links light once both ends have been tested.
  ...[
    [0, 4],
    [1, 5],
    [2, 6],
    [6, 10],
    [3, 11],
  ].map(([a, b]) => {
    const from = Math.max(pages[a].on, pages[b].on);
    return { a, b, from, to: from + 0.03 };
  }),
  // The critical finding travels to the report as a red pulse.
  { a: GLUCOSE, b: REPORT, from: 0.72, to: 0.86, kind: 3 },
];
export const QA_AGENTS = { path: TOUR, ...WALK, count: 3 };
export const QA_TIMELINE = { plan: 0.04, run: WALK.from, find: pages[GLUCOSE].on, report: 0.86 };

/**
 * Chapter 06: the payment-triggered WhatsApp chain, and the separate AI
 * outbound-calling flow (its own trigger — it is not fired by Pabbly).
 */
export const AUTO_NODES: FlowNode[] = [
  { id: "razorpay", pos: [-2.4, 0.6], on: 0.08 },
  { id: "webhook", pos: [-0.8, 0.6], on: 0.25 },
  { id: "pabbly", pos: [0.8, 0.6], on: 0.4, hub: true },
  { id: "whatsapp", pos: [2.4, 0.6], on: 0.55 },
  { id: "calls", pos: [-2.4, -0.75], on: 0.6 },
  { id: "callflow", pos: [0, -0.75], on: 0.72 },
  { id: "voice", pos: [2.4, -0.75], on: 0.86, hub: true },
];
export const AUTO_EDGES: FlowEdge[] = [
  { a: 0, b: 1, from: 0.1, to: 0.25, kind: 1 },
  { a: 1, b: 2, from: 0.25, to: 0.4, kind: 1 },
  { a: 2, b: 3, from: 0.4, to: 0.55, kind: 1 },
  { a: 4, b: 5, from: 0.6, to: 0.72, kind: 1 },
  { a: 5, b: 6, from: 0.72, to: 0.86, kind: 2 },
];
export const AUTO_LABELS: Record<string, string> = {
  razorpay: "Razorpay payment",
  webhook: "Webhook",
  pabbly: "Pabbly workflow",
  whatsapp: "WhatsApp Business",
  calls: "Call list",
  callflow: "Prompt + call flow",
  voice: "AI voice agent",
};
