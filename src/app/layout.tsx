import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono, Sora } from "next/font/google";
import { preloaderSkipScript } from "@/lib/preloader";
import { profile } from "@/data/profile";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Editorial serif for italic emphasis words only.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-instrument",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  // Not needed for first paint; leave bandwidth to the heading fonts.
  preload: false,
  variable: "--font-jetbrains",
  display: "swap",
});

const description =
  "Vishwaa Reddy — AI Engineer & AI Automation, Mumbai. Building LLM tooling, computer vision and automation agents that ship into real businesses.";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s — ${profile.name}`,
  },
  description,
  authors: [{ name: profile.name, url: profile.links.github }],
  keywords: [
    "AI Engineer",
    "AI Automation",
    "LLM tooling",
    "Python SDK",
    "Computer vision",
    "OCR",
    "AI automation",
    "Mumbai",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.name,
    title: `${profile.name} — ${profile.title}`,
    description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.title}`,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${serif.variable} ${jetbrains.variable}`}>
      <head>
        {/* Hides the preloader before first paint on repeat visits and with reduced motion. */}
        <script dangerouslySetInnerHTML={{ __html: preloaderSkipScript }} />
        <noscript>
          <style>{`[data-preloader]{display:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
