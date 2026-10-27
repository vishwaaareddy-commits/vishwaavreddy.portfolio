# Vishwaa Reddy — AI Engineer & AI Automation portfolio

Next.js (App Router) portfolio built around the **Inference Network**: an interactive
React Three Fiber graph of the systems on the page, with scroll-driven GSAP diagrams for each case study.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint
npm run typecheck
```

## Structure

```text
src/
├── app/            layout, page, global styles, icon, generated Open Graph image
├── components/
│   ├── layout/     Header, Footer
│   ├── sections/   one component per page section, in page order
│   ├── projects/   case-study layout and the interactive explainers
│   ├── three/      Inference Network (3D scene, 2D SVG fallback, hero wrapper)
│   ├── contact/    Formspree contact form
│   └── ui/         small shared pieces
├── data/           all site content — edit text here, not in components
├── hooks/          media-query and in-view hooks
├── lib/            GSAP registration, WebGL detection
└── types/          content types
public/
├── images/         profile photo
├── certificates/   certificate images linked from the timeline
└── documents/      résumé PDF
```

The 3D scene loads only on screens 1024px and wider with WebGL and motion enabled. Everywhere else the
same graph renders as an SVG. Node labels are real buttons, so the graph works with a keyboard.

## Content rules

Content in `src/data` uses only facts backed by the résumé, certificates or verified links. Unverified
metrics are intentionally absent. Keep it that way when editing.

## Environment variables

None. The contact form posts to the public Formspree endpoint in `src/data/profile.ts`.

## Deploying to Vercel (not done yet)

1. Import the repository in Vercel. The Next.js preset needs no settings changes.
2. Deploy a preview and check it.
3. Point a domain at it if wanted. `CNAME` belongs to the old GitHub Pages site and is not used by Vercel.

`/image/Vishwaa_Reddy_Updated_Resume.pdf`, the old résumé path, redirects to the new one.

## Previous static site

`index.html`, `styles.css`, `script.js` and the original assets at the repository root are the previous
GitHub Pages site. They are kept untouched until the new site is approved. Next.js does not serve them.
