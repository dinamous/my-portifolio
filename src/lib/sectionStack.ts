import gsap from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

let sections: HTMLElement[] = [];
let overlays: HTMLElement[] = [];
export function getOverlay(el: HTMLElement): HTMLElement | undefined {
  return overlays[sections.indexOf(el)];
}
const state = { value: 0 };
let target = 0; // raw progress, 0..sections.length-1, accumulated straight from scroll input
let max = 0;
let enabled = false;
let locked = false;
let observer: Observer;
let moveTo: (value: number) => void;

// fatia inicial do range de cada seção em que o scroll não move nada: a seção
// acabou de terminar sua entrada, então dá um respiro antes de começar a sair
const HOLD = 0.25;
const TRANSITION_DISTANCE = 1800; // px of wheel/touch travel to fully close one section into the next — higher means each wheel notch moves a smaller fraction, so steps between notches read as smooth glide instead of a jump
// o respiro come parte do range, então o curso total cresce na mesma proporção —
// sem isso a transição em si ficaria 33% mais rápida por notch de wheel
const DISTANCE = TRANSITION_DISTANCE / (1 - HOLD);
export const FINAL_WIDTH_VW = 5; // width (in vw) left uncovered when a section finishes closing
const MAX_INSET = (100 - FINAL_WIDTH_VW) / 2; // vw per side to shrink down to FINAL_WIDTH_VW
const FADE_START = 0.25; // fraction of the transition where the black overlay starts appearing
// ponytail: clip finishes closing before local hits 1, holding at FINAL_WIDTH_VW so the
// remaining range is free for the section's own finale (e.g. Hero's bar spin) before it hides
export const CLIP_CLOSE_T = 0.7;

function applyState() {
  sections.forEach((el, i) => {
    if (i === sections.length - 1) return; // last section never closes
    // raw termina em 1 no mesmo ponto de sempre; o HOLD só empurra o início
    const raw = gsap.utils.clamp(0, 1, state.value - i);
    const local = gsap.utils.clamp(0, 1, (raw - HOLD) / (1 - HOLD));

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
  // valor global (0..max) para quem precisa saber "onde" a pilha está sem
  // escutar cada seção — ex. SectionNav decide visibilidade e seção ativa
  window.dispatchEvent(new CustomEvent("stack:value", { detail: { value: state.value } }));
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
  // reduzido: escreve direto, sem tween — quickTo com duration 0 divide por
  // zero internamente e propaga NaN para state.value (pilha inteira congela)
  moveTo = reduceMotion
    ? (value: number) => {
        state.value = value;
        applyState();
      }
    : gsap.quickTo(state, "value", {
        duration: 0.75,
        ease: "power2.out",
        onUpdate: applyState,
      });

  observer = Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    onChange: (self) => {
      if (!enabled) return;
      // preventDefault:true mata o scroll nativo de qualquer coisa dentro das
      // seções, então uma coluna rolável (ex. lista da Skills) recebe o delta
      // aqui e só devolve o controle pra pilha quando bate na própria borda.
      // ponytail: scrollTop direto, sem tween — delta de wheel já vem em passos
      // pequenos; suavizar com quickTo se ficar seco.
      const scroller = (self.event.target as Element | null)?.closest?.(
        "[data-stack-scroll]",
      ) as HTMLElement | null;
      if (scroller) {
        const room = scroller.scrollHeight - scroller.clientHeight;
        const atEdge =
          self.deltaY > 0 ? scroller.scrollTop >= room - 1 : scroller.scrollTop <= 0;
        if (room > 0 && !atEdge) {
          scroller.scrollTop = gsap.utils.clamp(0, room, scroller.scrollTop + self.deltaY);
          return;
        }
      }
      target = gsap.utils.clamp(0, max, target + self.deltaY / DISTANCE);
      moveTo(target);
    },
  });
}

// Sections stay inert until the section revealing them finishes its own
// intro animation, so scroll input can't advance the stack mid-timeline.
export function enableSectionStack() {
  if (!locked) enabled = true;
}

// usado pelo overlay de detalhe do projeto: o Observer roda com preventDefault:true
// no window inteiro, então só zerar `enabled` não basta (ele ainda engoliria o wheel
// e o overlay nunca rolaria) — Observer.disable() solta a captura de fato. `locked`
// blinda contra o enableSectionStack() do Hero disparando enquanto travado (só pode
// acontecer numa carga direta em /projetos/:slug, no meio do intro do Hero).
export function lockSectionStack() {
  locked = true;
  enabled = false;
  observer?.disable();
}

export function unlockSectionStack() {
  locked = false;
  enabled = true;
  observer?.enable();
}

// permite navegação por clique (Navbar) sem duplicar a lista de seções —
// resolve o id contra o mesmo array `sections` que o Observer já usa, e
// escreve em `target` (não só em `moveTo`) porque é o acumulador cru que o
// onChange do Observer continua incrementando a partir daí; só chamar
// moveTo() sem atualizar target faria o próximo tick de wheel saltar de volta.
export function goToSection(idOrIndex: string | number) {
  const index =
    typeof idOrIndex === "number"
      ? idOrIndex
      : sections.findIndex((el) => el.id === idOrIndex);
  if (index < 0 || !moveTo) return;
  target = gsap.utils.clamp(0, max, index);
  moveTo(target);
}
