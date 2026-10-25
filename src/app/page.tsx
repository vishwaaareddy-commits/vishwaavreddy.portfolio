import { Footer } from "@/components/layout/Footer";
import { HashScroll } from "@/components/layout/HashScroll";
import { Header } from "@/components/layout/Header";
import { About } from "@/components/sections/About";
import { Archive } from "@/components/sections/Archive";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
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
  return (
    <>
      <Header />
      <HashScroll />
      <main id="main">
        <Hero release={release} />
        <ProofStrip />
        <SelectedWork release={release} />
        <MoreBuilds />
        <Capabilities />
        <Experience />
        <Archive />
        <About />
        <Contact />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    </>
  );
}
