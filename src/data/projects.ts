import type { ArchiveProject, Build, CaseStudy } from "@/types/content";

/**
 * Content rules: only facts from the résumé, certificates, the professional
 * brief (items marked Built or Stated) and verified public links. Unverified
 * metrics are deliberately left out.
 */

export const caseStudies: CaseStudy[] = [
  {
    id: "modelbridge",
    index: "003",
    title: "ModelBridge Python SDK",
    org: "Colab Platforms",
    kicker: "LLM tooling",
    status: "Built",
    statusNote: "Built and packaged for PyPI. Used in production at Colab Platforms.",
    problem:
      "Developers using Colab's multi-provider LLM gateway had a TypeScript client only. Python teams needed the same single interface without hand-writing HTTP calls for each provider.",
    contribution: [
      "Ported the TypeScript SDK to an idiomatic, async Python package.",
      "Implemented the chat, models, usage and credits resources on a shared HTTP layer.",
      "Added streaming responses as async generators, plus retries with exponential backoff.",
      "Wrote the README and runnable examples, and packaged the library for PyPI with twine.",
    ],
    stack: ["Python", "asyncio", "httpx", "dataclasses", "generics", "twine"],
    outcome:
      "One Python client streams chat completions through the gateway — during the build, to Gemini via OpenRouter — with the same call shape for every provider.",
  },
  {
    id: "esports-ocr",
    index: "004",
    title: "BGMI esports OCR",
    org: "Colab Platforms",
    kicker: "Computer vision",
    status: "In development",
    statusNote:
      "Player-name recognition works. Pairing finish counts with the right player was still being fixed in the latest build.",
    problem:
      "Tournament kills and placements were typed in by hand from match footage and leaderboard screenshots — slow, and easy to get wrong.",
    contribution: [
      "Built a Flask service that reads kill feeds from match video and leaderboards from screenshots.",
      "Isolated the kill-feed region with OpenCV HSV masking and located events with icon template matching.",
      "Upscaled crops 2× before PaddleOCR, and de-duplicated repeated frames.",
      "Matched stylised Unicode gamer tags to registered player names with difflib fuzzy matching.",
    ],
    stack: ["Python", "Flask", "OpenCV", "PaddleOCR", "difflib"],
    outcome:
      "Stylised in-game names resolve to the registered roster, turning frames into structured rows instead of manual entry.",
    evidenceNote: "Client project — code and match footage are private.",
  },
  {
    id: "takehealth-qa",
    index: "005",
    title: "TakeHealth QA",
    org: "TakeHealth",
    kicker: "Quality & safety",
    status: "Delivered",
    statusNote:
      "QA phases and reports delivered. Fixes were owned by the product team and are not shown here.",
    problem:
      "A health-tracking app needed systematic testing before real users met its bugs — where a mistake can mean losing someone's health records.",
    contribution: [
      "Designed and ran phased functional and UI/UX testing across 12 app pages.",
      "Used AI browser agents (Google Antigravity, Playwright MCP) to drive test runs.",
      "Wrote 4 plain-language QA reports for the product team.",
      "Found that glucose-log entries were deleted instantly, with no confirmation and no undo, and flagged it as the critical top fix.",
    ],
    stack: ["Test design", "Playwright MCP", "Google Antigravity", "QA reporting"],
    outcome:
      "A silent data-loss path in the glucose log was caught and prioritised as a critical finding before it reached more users.",
    evidenceNote: "QA reports and app screens are confidential.",
  },
  {
    id: "automation",
    index: "006",
    title: "WhatsApp & AI calling automation",
    org: "Avatar India",
    kicker: "Automation agents",
    status: "Delivered",
    statusNote: "Delivered to the team.",
    problem:
      "Payment follow-ups and customer outreach were handled manually, one message and one call at a time.",
    contribution: [
      "Built a payment-triggered WhatsApp flow: Razorpay events → Pabbly workflow → Meta WhatsApp Business message.",
      "Set up bulk messaging with contact cleaning before sends.",
      "Designed the prompt and call flow for an AI outbound-calling agent.",
    ],
    stack: ["Razorpay", "Webhooks", "Pabbly", "WhatsApp Business API", "Prompt design"],
    outcome:
      "Payment confirmations and follow-ups go out automatically, and outbound calls follow a designed AI call flow instead of a manual script.",
    evidenceNote: "Internal client workflow — not public.",
  },
];

export const builds: Build[] = [
  {
    id: "oms",
    title: "AyushWellness OMS",
    org: "AyushWellness",
    status: "In development",
    summary:
      "Order management system that brings e-commerce orders, payments and shipping into one place instead of separate dashboards.",
    highlight:
      "Signature-verified, idempotent webhooks for Cashfree, Shopify (HMAC with secret rotation) and Shiprocket, processed by Celery workers.",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "Celery", "Cashfree", "Shopify", "Shiprocket"],
    ownership:
      "Team project. I built the orders, customers, products, shipments, NDR/RTO, audit log and RBAC modules, and the payment and courier integrations.",
  },
  {
    id: "sales-crm",
    title: "Sales-CRM",
    org: "Avatar India",
    status: "In development",
    summary: "One workspace for a sales team's leads, orders, payments and refunds.",
    highlight:
      "COD-to-prepaid conversion through Cashfree payment links, and a manager-approved refund workflow.",
    stack: ["TypeScript", "Express", "Prisma", "Neon Postgres", "Next.js"],
    ownership:
      "Team project. My parts: the orders and Customer 360 epic, the WhatsApp epic, COD-to-prepaid and refunds.",
  },
  {
    id: "bhagya-astro",
    title: "Bhagya Astro",
    org: "Avatar India",
    status: "Partially implemented",
    summary:
      "Astrology platform with live temple streams, numerology tools and an AI Guru chat.",
    highlight:
      "Live Darshan switches streams automatically from YouTube live status, polled on a schedule.",
    stack: ["YouTube Data API v3", "MongoDB Atlas", "Redis", "QStash", "Firebase Auth"],
    ownership: "Currently in a restart and documentation phase.",
  },
  {
    id: "text-to-video",
    title: "Text-to-video automation",
    org: "Colab Platforms",
    status: "Partially implemented",
    summary:
      "n8n workflow that turns a topic into scene prompts, narration, subtitles and a video, delivered over Telegram.",
    highlight:
      "A cost-safe dummy node lets the whole pipeline be tested end to end without paying for generation.",
    stack: ["n8n", "HTTP nodes", "AI video APIs", "Telegram Bot"],
    ownership: "The final video-generation service is not yet confirmed.",
  },
  {
    id: "kom-smation",
    title: "Kom-smation AI ad tool",
    org: "AyushWellness",
    status: "In development",
    summary:
      "Generates ad concepts and scripts for products that previously took writers' time.",
    highlight:
      "Migrated image, text and vision generation to Gemini, with Hinglish hook-based script generation.",
    stack: ["Gemini", "OpenRouter", "FastAPI", "Next.js"],
  },
];

export const archive: ArchiveProject[] = [
  {
    title: "Drowsiness Detection System",
    context: "Academic",
    summary:
      "Real-time driver-fatigue alert that tracks facial landmarks and the eye aspect ratio from a webcam feed.",
    stack: ["Python", "OpenCV", "dlib"],
  },
  {
    title: "FitMind Tracker",
    context: "B.Sc. thesis",
    summary:
      "Mental-wellness tracking that applies data-mining and clustering to personal behavioural metrics.",
    stack: ["Python", "K-Means", "DBSCAN", "Matplotlib"],
  },
  {
    title: "HR Analytics Dashboard",
    context: "Academic",
    summary: "Flask dashboard to manage, view and download HR reports and metrics.",
    stack: ["Python", "Flask", "MySQL"],
  },
  {
    title: "Social Media Analytics",
    context: "Academic",
    summary: "Interactive dashboard visualising social-media engagement metrics.",
    stack: ["Python", "Power BI"],
  },
  {
    title: "ML Forecasting Models",
    context: "Academic",
    summary:
      "Forecasting and classification models with an emphasis on preprocessing and honest evaluation.",
    stack: ["scikit-learn", "Random Forest", "XGBoost", "LSTM"],
  },
  {
    title: "Personal Expense Tracker",
    context: "IIT Bombay Spoken Tutorial",
    summary:
      "Expense logging app with input validation, tracking and summaries of daily spending.",
    stack: ["Python", "HTML/CSS", "SQLite"],
  },
];
