import { PipelineDiagram } from "./PipelineDiagram";

const paymentFlow = [
  { label: "Payment event", detail: "A Razorpay payment is captured." },
  { label: "Webhook", detail: "Razorpay sends the event to the Pabbly workflow." },
  { label: "Pabbly workflow", detail: "The event is routed to the right message flow." },
  { label: "WhatsApp Business", detail: "The customer receives a WhatsApp message through Meta's API." },
];

const sideFlows = [
  {
    title: "Bulk messaging",
    steps: ["Contact list", "Clean contacts", "WhatsApp send"],
  },
  {
    title: "AI outbound calling",
    steps: ["Call list", "Prompt + call flow", "AI voice agent call"],
  },
];

export function AutomationDemo() {
  return (
    <div className="grid gap-5">
      <PipelineDiagram
        title="Payment-triggered WhatsApp flow"
        steps={paymentFlow}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {sideFlows.map((flow) => (
          <div key={flow.title} className="rounded-2xl border border-line bg-panel/60 p-5">
            <p className="eyebrow mb-4">{flow.title}</p>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              {flow.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-md border border-line bg-ink/60 px-2.5 py-1.5 text-fg">{step}</span>
                  {i < flow.steps.length - 1 ? (
                    <span aria-hidden className="font-mono text-accent">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
