// Records which optional media files exist under /public so components can
// render a designed fallback instead of a broken image. Runs before dev,
// build and type-check (see package.json).
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const optional = [
  "/work/modelbridge.png",
  "/work/esports-ocr.gif",
  "/work/esports-ocr.mp4",
  "/work/automation.png",
  "/about/photo.jpg",
];

const present = optional.filter((src) => existsSync(join(process.cwd(), "public", src)));
const out = join(process.cwd(), "src", "data", "media.generated.json");
writeFileSync(out, `${JSON.stringify({ present }, null, 2)}\n`);
console.log(`media manifest: ${present.length}/${optional.length} optional assets present`);
