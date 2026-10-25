import type { NetworkNode } from "@/types/content";

/**
 * The hero graph is an illustrative map of the systems on this page.
 * It does not call any model or service.
 */
export const networkNodes: NetworkNode[] = [
  {
    id: "request",
    label: "Request",
    role: "Incoming",
    detail: "A prompt, a match frame or a payment event enters the system.",
    shows: "A burst of requests leaving the entry point toward the integration layer.",
    link: { label: "See the selected work", href: "#work" },
    position: [-4.6, 0.2, 0.6],
    kind: "input",
  },
  {
    id: "layer",
    label: "Integration layer",
    role: "Routing · APIs · SDKs · webhooks",
    detail:
      "The part I build: clients, services and handlers that connect applications to models and business systems.",
    shows: "Every route fanning out from the hub to each service.",
    link: { label: "Browse capabilities", href: "#capabilities" },
    position: [-2.0, -0.1, 0],
    kind: "hub",
  },
  {
    id: "llm",
    label: "ModelBridge SDK",
    role: "Inference · Gemini via OpenRouter",
    detail: "Async Python client for a multi-provider LLM gateway, with streaming responses and retries.",
    shows: "The LLM path: request → SDK → provider, streaming back to the output.",
    link: { label: "Open the ModelBridge case study", href: "#modelbridge" },
    position: [0.7, 1.75, -1.3],
    kind: "sdk",
  },
  {
    id: "vision",
    label: "Vision / OCR",
    role: "Inference · OpenCV · PaddleOCR",
    detail: "Reads kill feeds and leaderboards from esports footage and matches names to a roster.",
    shows: "The computer-vision path: frames in, structured rows out.",
    link: { label: "Open the BGMI OCR case study", href: "#esports-ocr" },
    position: [1.2, 0.55, 1.15],
    kind: "vision",
  },
  {
    id: "automation",
    label: "Automation",
    role: "Workflows · Webhooks · WhatsApp · AI calling",
    detail: "Payment events trigger WhatsApp messages, and an AI agent places designed outbound calls.",
    shows: "The automation path: an event triggers a workflow and a message or call.",
    link: { label: "Open the automation case study", href: "#automation" },
    position: [0.4, -0.75, -0.7],
    kind: "automation",
  },
  {
    id: "data",
    label: "Orders & data",
    role: "Data · FastAPI · PostgreSQL · Celery",
    detail: "Signature-verified, idempotent webhooks feeding an order management system.",
    shows: "The order path: verified webhooks queued and written to the order record.",
    link: { label: "Open the OMS architecture", href: "#oms" },
    position: [1.0, -2.05, 0.75],
    kind: "data",
  },
  {
    id: "output",
    label: "Shipped feature",
    role: "Response",
    detail: "Streamed answers, structured match rows, sent messages and updated orders.",
    shows: "Every path converging on the result a user actually sees.",
    link: { label: "See the selected work", href: "#work" },
    position: [3.9, -0.1, 0.2],
    kind: "output",
  },
];

export const networkEdges: [string, string][] = [
  ["request", "layer"],
  ["layer", "llm"],
  ["layer", "vision"],
  ["layer", "automation"],
  ["layer", "data"],
  ["llm", "output"],
  ["vision", "output"],
  ["automation", "output"],
  ["data", "output"],
];

/** Column annotations drawn above the graph. */
export const networkStages = [
  { id: "stage-request", label: "Request", x: -4.6 },
  { id: "stage-routing", label: "Routing", x: -2.0 },
  { id: "stage-inference", label: "Inference", x: 0.8 },
  { id: "stage-response", label: "Response", x: 3.9 },
] as const;

export const networkOverview = {
  label: "Inference network",
  role: "System map",
  detail:
    "Requests enter on the left, pass through the integration layer I build, reach a model or business service, and leave as a shipped feature.",
  shows: "Select any node to trace its path through the system.",
  link: { label: "See the selected work", href: "#work" },
};
