import { AutomationDemo } from "@/components/projects/AutomationDemo";
import { CaseStudy } from "@/components/projects/CaseStudy";
import { ModelBridgeDemo } from "@/components/projects/ModelBridgeDemo";
import { ModelBridgeLinks } from "@/components/projects/ModelBridgeLinks";
import { OcrDemo } from "@/components/projects/OcrDemo";
import { QaDemo } from "@/components/projects/QaDemo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { caseStudies } from "@/data/projects";
import type { ModelBridgeRelease } from "@/lib/pypi";
import type { CaseStudy as CaseStudyData } from "@/types/content";

const byId = Object.fromEntries(caseStudies.map((s) => [s.id, s]));

/** The ModelBridge entry reflects PyPI: "Built" until `pip install` works. */
function withRelease(study: CaseStudyData, release: ModelBridgeRelease): CaseStudyData {
  if (!release.published) return study;
  return {
    ...study,
    status: "Published",
    statusNote: `Published on PyPI${release.version ? ` · v${release.version}` : ""}. Used in production at Colab Platforms.`,
  };
}

export function SelectedWork({ release }: { release: ModelBridgeRelease }) {
  return (
    <section id="work" aria-labelledby="work-title" className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-32">
      <SectionHeader
        id="work-title"
        index="01"
        eyebrow="Selected work"
        title="Four systems, explained by how they work."
        intro="Each case study separates what I built from team results and marks its real status. The diagrams and animations explain each architecture; they don't run live services."
      />
      <CaseStudy
        study={withRelease(byId.modelbridge, release)}
        visual={<ModelBridgeDemo published={release.published} usageExample={release.usageExample} />}
        media={{ src: "/work/modelbridge.png", alt: "ModelBridge SDK in use" }}
        actions={<ModelBridgeLinks release={release} />}
      />
      <CaseStudy
        study={byId["esports-ocr"]}
        visual={<OcrDemo />}
        layout="stacked"
        media={{ src: "/work/esports-ocr.gif", alt: "BGMI OCR reading a kill feed" }}
      />
      <CaseStudy study={byId["takehealth-qa"]} visual={<QaDemo />} reverse />
      <CaseStudy
        study={byId.automation}
        visual={<AutomationDemo />}
        media={{ src: "/work/automation.png", alt: "WhatsApp and AI calling automation workflow" }}
      />
    </section>
  );
}
