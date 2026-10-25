/** Shown until the published README provides the real usage example. */
export const usageSketch = `# Usage sketch — the README has the exact API.
import asyncio
from modelbridge_sdk import ModelBridge

async def main():
    async with ModelBridge() as client:
        async for chunk in client.chat.stream(
            model="gemini",
            messages=[{"role": "user", "content": "Explain retries in one line."}],
        ):
            print(chunk.text, end="", flush=True)

asyncio.run(main())`;

export const exampleReply =
  "Retries resend a failed request after a growing pause, so brief network or rate-limit errors don't reach your users.";

/** HTML labels for the chapter-03 scene, positioned by the canvas. */
export const modelBridgeLabels = [
  { id: "mb-app", label: "Your app" },
  { id: "mb-sdk", label: "ModelBridge SDK" },
  { id: "mb-gateway", label: "Gateway API" },
  { id: "mb-openrouter", label: "OpenRouter" },
  { id: "mb-gemini", label: "Gemini" },
  { id: "mb-chat", label: "chat" },
  { id: "mb-models", label: "models" },
  { id: "mb-usage", label: "usage" },
  { id: "mb-credits", label: "credits" },
] as const;
