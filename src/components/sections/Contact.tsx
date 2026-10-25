import { ArrowUpRight, FileText, Mail } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { profile } from "@/data/profile";

const links = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, Icon: Mail, external: false },
  { label: "LinkedIn", value: "vishwaa-reddy", href: profile.links.linkedin, Icon: LinkedInIcon, external: true },
  { label: "GitHub", value: "vishwaaareddy-commits", href: profile.links.github, Icon: GitHubIcon, external: true },
  { label: "Résumé", value: "PDF download", href: profile.resume, Icon: FileText, external: false, download: true },
];

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-line bg-ink-2">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeader
          id="contact-title"
          index="07"
          eyebrow="Contact"
          title="Have a system that should use AI?"
          intro={`I'm based in ${profile.location}. Email is the fastest way to reach me.`}
        />
        <Reveal className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <ul data-reveal className="space-y-3 lg:col-span-5">
            {links.map(({ label, value, href, Icon, external, download }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  {...(download ? { download: true } : {})}
                  className="group flex items-center gap-4 rounded-xl border border-line px-4 py-3.5 transition-colors duration-300 hover:border-accent/50"
                >
                  <Icon className="size-4 text-soft group-hover:text-accent" />
                  <span className="flex-1">
                    <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-faint">{label}</span>
                    <span className="block text-fg">{value}</span>
                  </span>
                  <ArrowUpRight
                    className="size-4 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
          <div data-reveal className="lg:col-span-7">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
