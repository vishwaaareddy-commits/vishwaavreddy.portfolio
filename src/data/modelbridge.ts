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
