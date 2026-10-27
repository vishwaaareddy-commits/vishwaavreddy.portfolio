import Image from "next/image";
import { hasMedia } from "@/components/ui/MediaFrame";
import { Reveal } from "@/components/ui/Reveal";

// Prefer the dedicated portrait once it has been added to /public/about.
const photo = hasMedia("/about/photo.jpg") ? "/about/photo.jpg" : "/images/profile.jpg";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-line">
      <div data-copy className="shell py-24 md:py-32">
        <SectionHeader id="about-title" index="010" eyebrow="About" title="Turning models into systems people use." />
        <Reveal className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div data-reveal className="md:col-span-4 md:col-start-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line">
              <Image
                src={photo}
                alt="Portrait of Vishwaa Reddy"
                fill
                sizes="(min-width: 768px) 30vw, 100vw"
                className="object-cover object-[50%_30%]"
              />
            </div>
          </div>
          <div data-reveal className="space-y-6 text-lg leading-relaxed text-soft md:col-span-7 md:col-start-6">
            <p>
              I studied Data Science at SIES College in Mumbai, where most of my work lived in notebooks: classifiers,
              forecasting models, clustering for my thesis, and a computer-vision drowsiness detector.
            </p>
            <p>
              Internships pulled me toward building. I was named Best Performer in Elevate Labs&apos; AI/ML internship,
              then completed a Python and PostgreSQL internship through IIT Bombay&apos;s Spoken Tutorial. Since April
              2026 I&apos;ve worked as an AI Expert at Avatar India and Colab Platforms. There, the job is less about
              training models and more about making existing ones useful — a client that reaches many LLMs through one
              interface, OCR that reads esports footage, and automation that reacts to real payments.
            </p>
            <p>
              Before that, I was Gymkhana Joint Secretary at SIES and Event Chairperson for Nexora, a college event with
              more than 8,000 attendees, and I hold a district certificate in Kabaddi. Running events taught me what
              shipping software keeps confirming: the unglamorous details decide whether something works.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
