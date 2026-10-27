import { profile } from "@/data/profile";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-3 py-10 text-sm text-faint md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.name} · {profile.title} · {profile.location}
        </p>
        <p className="font-mono text-xs">Built with Next.js, React Three Fiber and GSAP.</p>
      </div>
    </footer>
  );
}
