"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Keep triggers in page order before every refresh, including the automatic
  // load and resize refreshes, so pins are accounted for in everything below.
  ScrollTrigger.addEventListener("refreshInit", () => ScrollTrigger.sort());
  // DIAGNOSTIC (temporary): mark every refresh.
  ScrollTrigger.addEventListener("refreshInit", () => performance.mark("st-refresh"));
}

let pending: ReturnType<typeof setTimeout> | undefined;

/**
 * One re-measure after chapters (re)mount. While the page is still loading
 * this does nothing: ScrollTrigger refreshes once on load (and on resize) by
 * itself. After load, calls within 250 ms collapse into a single refresh.
 */
export function scheduleRefresh() {
  if (typeof window === "undefined" || document.readyState !== "complete") return;
  clearTimeout(pending);
  pending = setTimeout(() => {
    pending = undefined;
    ScrollTrigger.refresh();
  }, 250);
}

export { gsap, ScrollTrigger, useGSAP };
