import { AutomationDemo } from "@/components/projects/AutomationDemo";
import { CaseStudy } from "@/components/projects/CaseStudy";
import { ModelBridgeDemo } from "@/components/projects/ModelBridgeDemo";
import { OcrDemo } from "@/components/projects/OcrDemo";
import { QaDemo } from "@/components/projects/QaDemo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { caseStudies } from "@/data/projects";

const byId = Object.fromEntries(caseStudies.map((s) => [s.id, s]));

export function SelectedWork() {
  return (
    <section id="work" aria-labelledby="work-title" className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-32">
      <SectionHeader
        id="work-title"
        index="01"
        eyebrow="Selected work"
        title="Four systems, explained by how they work."
        intro="Each case study separates what I built from team results, and marks its real status. Interactive diagrams are explanations of the architecture — none of them call live services."
      />
      <CaseStudy study={byId.modelbridge} visual={<ModelBridgeDemo />} />
      <CaseStudy study={byId["esports-ocr"]} visual={<OcrDemo />} layout="stacked" />
      <CaseStudy study={byId["takehealth-qa"]} visual={<QaDemo />} reverse />
      <CaseStudy study={byId.automation} visual={<AutomationDemo />} />
    </section>
  );
}
