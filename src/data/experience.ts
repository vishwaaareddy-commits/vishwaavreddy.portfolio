import type { CapabilityGroup, TimelineEntry } from "@/types/content";

export const capabilities: CapabilityGroup[] = [
  {
    id: "llm",
    title: "LLM tooling & agents",
    items: [
      "Python SDK design",
      "Multi-provider LLM APIs (Gemini, OpenRouter)",
      "Async streaming & retries",
      "Prompt and AI call-flow design",
    ],
    provenBy: ["modelbridge", "automation", "kom-smation"],
  },
  {
    id: "vision",
    title: "Computer vision",
    items: ["OpenCV (HSV masking)", "PaddleOCR", "Template matching", "Fuzzy matching", "Frame de-duplication"],
    provenBy: ["esports-ocr"],
  },
  {
    id: "automation",
    title: "Automation & integrations",
    items: ["n8n & Pabbly", "WhatsApp Business API", "Signed webhooks", "Cashfree, Razorpay, Shopify, Shiprocket"],
    provenBy: ["automation", "oms", "text-to-video", "sales-crm"],
  },
  {
    id: "fullstack",
    title: "Full-stack delivery",
    items: [
      "Python, TypeScript, SQL",
      "FastAPI, Flask, Express",
      "React & Next.js",
      "PostgreSQL, Redis, Celery",
      "AI-assisted QA (Playwright MCP)",
    ],
    provenBy: ["oms", "sales-crm", "takehealth-qa", "bhagya-astro"],
  },
];

export const timeline: TimelineEntry[] = [
  {
    role: "AI Expert",
    org: "Avatar India · Colab Platforms",
    period: "Apr 2026 — Present",
    kind: "Role",
    current: true,
    summary:
      "Delivering AI, automation and full-stack work for Avatar India, Colab Platforms, TakeHealth and AyushWellness — from an LLM SDK and esports OCR to payment-driven automation.",
  },
  {
    role: "Python & PostgreSQL Intern",
    org: "EduPyramids · SINE, IIT Bombay (Spoken Tutorial)",
    period: "Feb — Mar 2026",
    kind: "Internship",
    summary:
      "Self-paced internship in Python and PostgreSQL; built a Personal Expense Tracker with validated data entry.",
    certificate: {
      label: "Certificate",
      href: "/certificates/edupyramids-python-postgresql-internship.png",
    },
  },
  {
    role: "AI / ML Intern",
    org: "Elevate Labs · Skill India / MSME",
    period: "May — Jun 2025",
    kind: "Internship",
    badge: "Best Performer",
    summary:
      "Certified internship with hands-on AI/ML tasks in model building and deployment; recognised as Best Performer.",
    certificate: {
      label: "Certificate",
      href: "/certificates/elevate-labs-aiml-internship.png",
    },
  },
  {
    role: "GenAI Job Simulation",
    org: "BCG X on Forage",
    period: "May 2025",
    kind: "Virtual simulation",
    summary:
      "Virtual job simulation — not employment. Tasks: data extraction and initial analysis, and an AI-powered financial chatbot prototype.",
    certificate: {
      label: "Certificate",
      href: "/certificates/bcg-x-genai-job-simulation.png",
    },
  },
  {
    role: "B.Sc. Data Science",
    org: "SIES College of Arts, Science & Commerce (Empowered Autonomous), Mumbai",
    period: "Completed 2026",
    kind: "Education",
    badge: "CGPA 8.33 / 10",
    summary:
      "Coursework in machine learning, data mining, computer vision, NLP, cloud computing and databases.",
  },
];
