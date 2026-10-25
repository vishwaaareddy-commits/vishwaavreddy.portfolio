import { profile } from "@/data/profile";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-sm text-faint md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </p>
        <p className="font-mono text-xs">Built with Next.js, React Three Fiber and GSAP.</p>
      </div>
    </footer>
  );
}
