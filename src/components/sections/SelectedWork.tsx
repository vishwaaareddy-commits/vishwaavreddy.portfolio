import { ModelBridgeChapter } from "@/components/journey/chapters/ModelBridgeChapter";
import { AutomationChapter, QaChapter } from "@/components/journey/chapters/FlowChapters";
import { OcrChapter } from "@/components/journey/chapters/OcrChapter";
import { WorkIntroChapter } from "@/components/journey/chapters/WorkIntroChapter";
import { ModelBridgeLinks } from "@/components/projects/ModelBridgeLinks";
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

/** Chapters 02–06 of the journey. */
export function SelectedWork({ release }: { release: ModelBridgeRelease }) {
  const modelbridge = withRelease(byId.modelbridge, release);
  return (
    <>
      <WorkIntroChapter />
      <ModelBridgeChapter study={modelbridge} usageExample={release.usageExample} endSlot={<ModelBridgeLinks release={release} />} />
      <OcrChapter study={byId["esports-ocr"]} />
      <QaChapter study={byId["takehealth-qa"]} />
      <AutomationChapter study={byId.automation} />
    </>
  );
}
