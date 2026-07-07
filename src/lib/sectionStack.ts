import gsap from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

let sections: HTMLElement[] = [];
let overlays: HTMLElement[] = [];
const state = { value: 0 };
let target = 0; // raw progress, 0..sections.length-1, accumulated straight from scroll input
let max = 0;
let enabled = false;
let moveTo: (value: number) => void;

const DISTANCE = 1800; // px of wheel/touch travel to fully close one section into the next — higher means each wheel notch moves a smaller fraction, so steps between notches read as smooth glide instead of a jump
export const FINAL_WIDTH_VW = 5; // width (in vw) left uncovered when a section finishes closing
const MAX_INSET = (100 - FINAL_WIDTH_VW) / 2; // vw per side to shrink down to FINAL_WIDTH_VW
const FADE_START = 0.25; // fraction of the transition where the black overlay starts appearing
// ponytail: clip finishes closing before local hits 1, holding at FINAL_WIDTH_VW so the
// remaining range is free for the section's own finale (e.g. Hero's bar spin) before it hides
export const CLIP_CLOSE_T = 0.7;

function applyState() {
  sections.forEach((el, i) => {
    if (i === sections.length - 1) return; // last section never closes
    const local = gsap.utils.clamp(0, 1, state.value - i);

    // ponytail: opt-out for sections whose next transition isn't the shrink-to-bar
    // wipe (e.g. one covered by its own curtain elements instead) — they still get
    // `local` progress via stack:progress below, just skip this generic visual.
    if (!el.hasAttribute("data-no-close-clip")) {
      const clipT = gsap.utils.clamp(0, 1, local / CLIP_CLOSE_T);
      const inset = clipT * MAX_INSET;
      // ponytail: no hard visibility toggle here — that boolean flip right at the local===1
      // boundary is what caused the flicker (state settles/overshoots near the edge). The
      // section is expected to collapse itself away (e.g. Hero scales its bar down to 0)
      // by the time local reaches 1, so there's nothing left to hide by then anyway.
      gsap.set(el, { clipPath: `inset(0 ${inset}vw 0 ${inset}vw)` });
      // tied to clipT (not local) so the overlay is already fully opaque by the time
      // clipT finishes closing, instead of still ramping up during the finale that follows
      const fadeT = gsap.utils.clamp(0, 1, (clipT - FADE_START) / (1 - FADE_START));
      gsap.set(overlays[i], { opacity: Math.pow(fadeT, 0.6) }); // ponytail: exponent <1 front-loads the ramp so it reads dark sooner
    }

    // lets each section react to its own closing progress (e.g. parallax content away)
    // without this generic module reaching into section-specific DOM
    el.dispatchEvent(new CustomEvent("stack:progress", { detail: { progress: local } }));
  });
}

// ponytail: module-level singleton, mirrors the old getSmoother() pattern —
// whichever script runs first wires up the Observer once for the whole page
export function initSectionStack(selector = "[data-stack]") {
  if (sections.length) return;
  sections = Array.from(document.querySelectorAll<HTMLElement>(selector));
  max = sections.length - 1;

  // earlier sections stack on top so they fully cover later ones until their
  // own clip-path closes — DOM order alone would put the last section on top
  sections.forEach((el, i) => {
    el.style.zIndex = String(sections.length - i);
  });

  // black overlay fades in on top of each closing section for the back half
  // of its transition, so it ends the wipe fully dark instead of a hard cut
  overlays = sections.map((el) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:0;z-index:10;background:#000;opacity:0;pointer-events:none;";
    el.appendChild(overlay);
    return overlay;
  });

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // quickTo retargets the same running tween instead of starting a fresh one
  // per event — that's what smooths out discrete wheel notches without a
  // restart-from-zero-velocity kink each time (and without the lag a longer
  // one-off gsap.to would add)
  moveTo = gsap.quickTo(state, "value", {
    duration: reduceMotion ? 0 : 0.75,
    ease: "power2.out",
    onUpdate: applyState,
  });

  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    onChange: (self) => {
      if (!enabled) return;
      target = gsap.utils.clamp(0, max, target + self.deltaY / DISTANCE);
      moveTo(target);
    },
  });
}

// Sections stay inert until the section revealing them finishes its own
// intro animation, so scroll input can't advance the stack mid-timeline.
export function enableSectionStack() {
  enabled = true;
}
