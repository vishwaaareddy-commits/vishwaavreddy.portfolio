import { create } from "zustand";

/** Chapter registry: index, nav anchor and the name shown in the chapter pill. */
export const CHAPTERS = [
  { index: 0, id: "preloader", name: "Initializing" },
  { index: 1, id: "top", name: "Introduction" },
  { index: 2, id: "work", name: "Selected work" },
  { index: 3, id: "modelbridge", name: "ModelBridge" },
  { index: 4, id: "esports-ocr", name: "Esports OCR" },
  { index: 5, id: "takehealth-qa", name: "TakeHealth QA" },
  { index: 6, id: "automation", name: "Automation" },
  { index: 7, id: "builds", name: "Builds" },
  { index: 8, id: "capabilities", name: "Capabilities" },
  { index: 9, id: "experience", name: "Experience" },
  { index: 10, id: "about", name: "About" },
  { index: 11, id: "contact", name: "Contact" },
] as const;

export type ChapterIndex = (typeof CHAPTERS)[number]["index"];

interface JourneyState {
  /** Chapter currently in view. */
  chapter: number;
  /**
   * Continuous position through the journey: chapter index + that chapter's
   * 0→1 scroll progress. The 3D scene reads this every frame.
   */
  t: number;
  /** Set when the preloader finishes; the Core ignites. */
  ignited: boolean;
  /** Contact finale progress (0→1) as the contact heading scrolls in. */
  finale: number;
  setChapter: (chapter: number) => void;
  setT: (t: number) => void;
  setFinale: (finale: number) => void;
  ignite: () => void;
}

export const useJourney = create<JourneyState>((set) => ({
  chapter: 1,
  t: 1,
  ignited: false,
  finale: 0,
  setChapter: (chapter) => set((s) => (s.chapter === chapter ? s : { chapter })),
  setT: (t) => set({ t }),
  setFinale: (finale) => set({ finale }),
  ignite: () => set({ ignited: true }),
}));

/**
 * Visibility of a chapter scene: fades in over the first `fadeIn` of the
 * chapter and out over the last `fadeOut`. Exactly 0 outside the chapter,
 * so a scene can never linger into the next one.
 */
export function chapterVisibility(t: number, index: number, fadeIn = 0.1, fadeOut = 0.18) {
  if (t <= index || t >= index + 1) return 0;
  const p = t - index;
  const up = Math.min(1, p / fadeIn);
  const down = Math.min(1, (1 - p) / fadeOut);
  return Math.max(0, Math.min(up, down));
}

/** Progress (0→1) of one chapter given the journey position. */
export function chapterProgress(t: number, index: number) {
  return Math.min(1, Math.max(0, t - index));
}

/** DOM labels positioned by the canvas each frame (text stays real HTML). */
export const labelRegistry = new Map<string, HTMLElement>();
