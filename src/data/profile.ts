export const profile = {
  name: "Vishwaa Reddy",
  title: "Applied AI Engineer",
  statement:
    "I build AI that ships into real businesses — LLM tooling, computer vision and automation agents, wired into the payments, queues and databases that make them useful.",
  tagline: "Building practical AI systems, integrations, automation and intelligent applications.",
  currentRole: "AI Expert at Avatar India · Colab Platforms",
  currentSince: "29 April 2026",
  location: "Mumbai, Maharashtra, India",
  email: "vishwaavreddy@gmail.com",
  resume: "/documents/vishwaa-reddy-resume.pdf",
  siteUrl: "https://vishwaavreddy-portfolio.vercel.app",
  links: {
    github: "https://github.com/vishwaaareddy-commits",
    linkedin: "https://www.linkedin.com/in/vishwaa-reddy-065000407",
  },
  /** Formspree endpoint carried over from the previous site. Public by design. */
  formEndpoint: "https://formspree.io/f/xldapbyy",
} as const;

export const navItems = [
  { href: "#work", label: "Work" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#experience", label: "Experience" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
] as const;
