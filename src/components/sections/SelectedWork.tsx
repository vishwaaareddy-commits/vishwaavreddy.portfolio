import { ModelBridgeChapter } from "@/components/journey/chapters/ModelBridgeChapter";
import { WorkIntroChapter } from "@/components/journey/chapters/WorkIntroChapter";
import { AutomationDemo } from "@/components/projects/AutomationDemo";
import { CaseStudy } from "@/components/projects/CaseStudy";
import { ModelBridgeLinks } from "@/components/projects/ModelBridgeLinks";
import { OcrDemo } from "@/components/projects/OcrDemo";
import { QaDemo } from "@/components/projects/QaDemo";
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

/** Chapters 02–03 of the journey, then the case studies still to be rebuilt as chapters. */
export function SelectedWork({ release }: { release: ModelBridgeRelease }) {
  const modelbridge = withRelease(byId.modelbridge, release);
  return (
    <>
      <WorkIntroChapter />
      <ModelBridgeChapter
        status={modelbridge.status}
        statusNote={modelbridge.statusNote}
        usageExample={release.usageExample}
        endSlot={<ModelBridgeLinks release={release} />}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-5 md:pl-24 md:pr-10 xl:px-8">
        <CaseStudy
          study={modelbridge}
          visual={null}
          media={{ src: "/work/modelbridge.png", alt: "ModelBridge SDK in use" }}
          continuesFrom={{ id: "modelbridge-details", labelledBy: "modelbridge-title" }}
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
      </div>
    </>
  );
}
