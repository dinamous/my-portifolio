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

const DISTANCE = 900; // px of wheel/touch travel to fully close one section into the next
export const FINAL_WIDTH_VW = 5; // width (in vw) left uncovered when a section finishes closing
const MAX_INSET = (100 - FINAL_WIDTH_VW) / 2; // vw per side to shrink down to FINAL_WIDTH_VW
const FADE_START = 0.5; // fraction of the transition where the black overlay starts appearing

function applyState() {
  sections.forEach((el, i) => {
    if (i === sections.length - 1) return; // last section never closes
    const local = gsap.utils.clamp(0, 1, state.value - i);
    const inset = local * MAX_INSET;
    gsap.set(el, {
      clipPath: `inset(0 ${inset}vw 0 ${inset}vw)`,
      // fully closed reversibly hides the section instead of leaving a dead
      // sliver behind; scrolling back up (local < 1) restores it next update
      visibility: local >= 1 ? "hidden" : "visible",
    });
    gsap.set(overlays[i], {
      opacity: gsap.utils.clamp(0, 1, (local - FADE_START) / (1 - FADE_START)),
    });
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
    duration: reduceMotion ? 0 : 0.45,
    ease: "power3",
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
