/** sessionStorage key set once the preloader has played in this tab. */
export const PRELOADER_KEY = "vr-preloaded";

/** Inline <head> script: hides the preloader before first paint on repeat visits and with reduced motion. */
export const preloaderSkipScript = `try{if(sessionStorage.getItem("${PRELOADER_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){var s=document.createElement("style");s.textContent="[data-preloader]{display:none!important}";document.head.appendChild(s)}}catch(e){}`;
