import { ChapterSpy } from "@/components/journey/ChapterSpy";
import { HeroChapter } from "@/components/journey/chapters/HeroChapter";
import { ChapterPill } from "@/components/journey/chrome/ChapterPill";
import { Cursor } from "@/components/journey/chrome/Cursor";
import { Frame } from "@/components/journey/chrome/Frame";
import { TrainingHud } from "@/components/journey/chrome/TrainingHud";
import { JourneyStage } from "@/components/journey/JourneyStage";
import { Preloader } from "@/components/journey/Preloader";
import { SmoothScroll } from "@/components/journey/SmoothScroll";
import { Footer } from "@/components/layout/Footer";
import { HashScroll } from "@/components/layout/HashScroll";
import { Header } from "@/components/layout/Header";
import { About } from "@/components/sections/About";
import { Archive } from "@/components/sections/Archive";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { MoreBuilds } from "@/components/sections/MoreBuilds";
import { ProofStrip } from "@/components/sections/ProofStrip";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { profile } from "@/data/profile";
import { getModelBridgeRelease } from "@/lib/pypi";

// Re-check PyPI status and downloads once a day.
export const revalidate = 86400;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.title,
  email: `mailto:${profile.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressRegion: "Maharashtra", addressCountry: "IN" },
  alumniOf: "SIES College of Arts, Science & Commerce",
  sameAs: [profile.links.github, profile.links.linkedin],
};

export default async function Home() {
  const release = await getModelBridgeRelease();
  const releaseLabel = release.published
    ? `Published on PyPI · ModelBridge SDK${release.version ? ` v${release.version}` : ""}`
    : "Built · ModelBridge SDK";
  return (
    <>
      <Preloader />
      <JourneyStage />
      <SmoothScroll />
      <Frame />
      <ChapterPill />
      <TrainingHud />
      <Cursor />
      <Header />
      <HashScroll />
      <ChapterSpy />
      <main id="main" className="relative z-10">
        <HeroChapter releaseLabel={releaseLabel} />
        <ProofStrip />
        <SelectedWork release={release} />
        <MoreBuilds />
        <Capabilities />
        <Experience />
        <Archive />
        <About />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    </>
  );
}
