import { useEffect } from "react";
import gsap from "gsap";
import { CLIP_CLOSE_T } from "../../lib/sectionStack";
import { prefersReducedMotion } from "../../lib/motion";
import { scrubTimeline } from "../../lib/scrub";
import AnimatedLetters from "../../components/AnimatedLetters";
import AnimatedWords from "../../components/AnimatedWords";
import "./WhatIDo.css";

// ponytail: placeholder copy, swap in real content
const leftTitle = "Arquitetura";
const leftText =
  "Desenvolvimento modular, limpo e de alta performance. Layouts responsivos com foco na acessibilidade e semântica web. Codificação robusta para experiências estáveis.";
const rightTitle = "Experiência";
const rightText =
  "Transições fluidas e micro-interações elegantes que dão vida à interface. Criação de experiências imersivas e jornadas do usuário cativantes através do movimento.";

export default function WhatIDo() {
  useEffect(() => {
    const section = document.getElementById("whatido-section")!;
    const grid = document.getElementById("whatido-grid")!;
    const colLeft = document.getElementById("whatido-col-left")!;
    const colRight = document.getElementById("whatido-col-right")!;
    const cols = [colLeft, colRight];

    const reduceMotion = prefersReducedMotion();

    // the title's gradient lives per-letter (see .whatido__letter CSS) so each
    // letter can animate independently — this stretches one shared background
    // across the full title width and offsets each letter to its own slice, so
    // it still reads as a single continuous cyan->emerald sweep across the word
    function layoutTitleGradient(titleEl: HTMLElement) {
      const totalWidth = titleEl.offsetWidth;
      titleEl
        .querySelectorAll<HTMLElement>(".whatido__letter")
        .forEach((letter) => {
          const offset =
            letter.getBoundingClientRect().left -
            titleEl.getBoundingClientRect().left;
          letter.style.backgroundSize = `${totalWidth}px 100%`;
          letter.style.backgroundPosition = `${-offset}px 0`;
        });
    }

    // builds a paused timeline for one column: title (letter by letter) ->
    // paragraph (word by word), each phase starting slightly before the
    // previous one finishes so the reveal reads continuous rather than stepped.
    // Letters get a subtle 3D flip-up (rotateX) instead of a plain slide, and an
    // elastic-leaning ease on the title gives the reveal more character than a
    // generic power-out would.
    function buildRevealTimeline(colId: string, titleId: string) {
      const col = document.getElementById(colId)!;
      const titleEl = document.getElementById(titleId)!;
      layoutTitleGradient(titleEl);

      const letters = titleEl.querySelectorAll<HTMLElement>(".whatido__letter");
      const words = col.querySelectorAll<HTMLElement>(".whatido__word");

      gsap.set(
        col.querySelectorAll(".whatido__letter-wrap, .whatido__word-wrap"),
        {
          transformPerspective: 400,
        },
      );
      gsap.set(letters, {
        yPercent: 115,
        rotateX: -50,
        opacity: 0,
        transformOrigin: "50% 100%",
      });
      gsap.set(words, { yPercent: 60, opacity: 0 });

      return gsap
        .timeline({ paused: true })
        .to(letters, {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.028,
          ease: "back.out(1.7)",
        })
        .to(
          words,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.04,
            ease: "power2.out",
          },
          "-=0.2",
        );
    }

    let cleanupMousemove: (() => void) | undefined;
    let onBarShrink: EventListener | undefined;

    if (reduceMotion) {
      gsap.set(cols, { x: 0, opacity: 1 });
      gsap.set(grid, { opacity: 1 });
      gsap.set(section.querySelectorAll(".whatido__letter, .whatido__word"), {
        y: 0,
        opacity: 1,
      });
    } else {
      gsap.set(colLeft, { x: "-3vw", opacity: 0 });
      gsap.set(colRight, { x: "3vw", opacity: 0 });
      gsap.set(grid, { opacity: 0, scale: 1.08 });

      const revealLeft = buildRevealTimeline(
        "whatido-col-left",
        "whatido-title-left",
      );
      const revealRight = buildRevealTimeline(
        "whatido-col-right",
        "whatido-title-right",
      );
      const REVEAL_START_T = 0.55; // hold reveal until Hero's bar has closed most of the way
      const RIGHT_LAG_T = 0.08; // right column's reveal starts slightly behind the left's
      const spinCloseEase = gsap.parseEase("sine.out");

      // reveal progress lags behind its raw scroll-mapped target instead of snapping to
      // it every tick (mirrors ScrollTrigger's numeric `scrub` lag, and sectionStack's
      // own quickTo smoothing of state.value) so the timelines glide instead of racing
      // through in whatever single scroll tick crosses their range.
      const setLeftProgress = scrubTimeline(revealLeft);
      const setRightProgress = scrubTimeline(revealRight);

      // scroll-driven: columns fade in and slide toward center as the hero bar
      // closes, then keep pulling further toward center once it starts spinning
      // (see Hero.astro's spinT, same CLIP_CLOSE_T threshold). The reveal timelines
      // are scrubbed via .progress() off the same t instead of played()/reversed()
      // once at a threshold, so they track scroll position directly (ScrollTrigger's
      // scrub behavior) rather than running on their own once triggered.
      onBarShrink = ((e: CustomEvent<{ progress: number }>) => {
        const t = e.detail.progress;

        setLeftProgress(
          gsap.utils.clamp(
            0,
            1,
            (t - REVEAL_START_T) / (CLIP_CLOSE_T - REVEAL_START_T),
          ),
        );
        setRightProgress(
          gsap.utils.clamp(
            0,
            1,
            (t - REVEAL_START_T - RIGHT_LAG_T) /
              (CLIP_CLOSE_T - REVEAL_START_T - RIGHT_LAG_T),
          ),
        );

        const colsT = gsap.utils.clamp(0, 1, t / 0.35);
        gsap.set(grid, {
          opacity: colsT,
          scale: gsap.utils.interpolate(1.08, 1, colsT),
        });
        gsap.set(colLeft, {
          x: gsap.utils.interpolate("-3vw", "-4vw", colsT),
          opacity: colsT,
        });
        gsap.set(colRight, {
          x: gsap.utils.interpolate("3vw", "4vw", colsT),
          opacity: colsT,
        });

        // eased (not linear like the phases above) so the converge reads as a
        // deliberate snap-together finish rather than drifting in at the same
        // rate as everything else; overshoots past their natural centered flex
        // position (not just 0vw) so the columns visibly close in on each other.
        const spinT = spinCloseEase(
          gsap.utils.clamp(0, 1, (t - CLIP_CLOSE_T) / (1 - CLIP_CLOSE_T)),
        );
        gsap.set(colLeft, { x: gsap.utils.interpolate("-4vw", "9vw", spinT) });
        gsap.set(colRight, { x: gsap.utils.interpolate("4vw", "-9vw", spinT) });
      }) as EventListener;
      window.addEventListener("hero:bar-shrink", onBarShrink);

      // mouse-driven depth parallax, same per-layer quickTo technique as
      // AboutMe.astro: grid drifts opposite the cursor (background), columns
      // drift with it (foreground). Listening on the section itself (rather than
      // window, like AboutMe does) keeps it scoped to whichever stacked section
      // is currently on top, since this one — unlike AboutMe's curtain — isn't
      // pointer-events:none.
      const gridX = gsap.quickTo(grid, "x", { duration: 1.2, ease: "power3" });
      const gridY = gsap.quickTo(grid, "y", { duration: 1.2, ease: "power3" });
      const leftY = gsap.quickTo(colLeft, "y", { duration: 0.8, ease: "power3" });
      const rightY = gsap.quickTo(colRight, "y", { duration: 0.8, ease: "power3" });

      // columns tilt opposite each other (one rises as the other dips) for a
      // seesaw depth cue, while the grid drifts opposite the cursor as the
      // background layer — same layered-opposition idea as AboutMe's glows.
      const onMousemove = (e: MouseEvent) => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        gridX(-dx * 50);
        gridY(-dy * 50);
        leftY(dy * 34);
        rightY(-dy * 34);
      };
      section.addEventListener("mousemove", onMousemove);
      cleanupMousemove = () => section.removeEventListener("mousemove", onMousemove);
    }

    // rebroadcasts this section's own closing progress on window, same as Hero does
    // with hero:bar-shrink, so the next stacked section (AboutMe) can react to it
    // without reaching into this section's DOM directly. Unconditional (not just in
    // the non-reduced branch) because sectionStack still drives stack:progress on
    // every data-stack section regardless of reduced motion — and this section must
    // hide itself once fully scrolled past: it has data-no-close-clip (AboutMe's
    // curtain covers it visually instead of it shrinking itself), but with sections
    // now stacked after AboutMe, this section's z-index (1-indexed, always higher
    // than Projects/Skills/Contact's) would otherwise sit above them forever and
    // block them from ever being visible once AboutMe's own clip-path opens up.
    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const t = e.detail.progress;

      // once the reveal is done (t starts climbing only after Hero has fully closed),
      // dissolve+shrink the content instead of leaving it at full opacity for AboutMe's
      // curtain to hard-cover — runs after the hero:bar-shrink handler above in the same
      // tick, so it wins over that handler's opacity/scale for cols and grid. Finishes by
      // t=0.5, ahead of the curtain fully closing (t=0.6, see AboutMe's coverT), so nothing
      // visible pops out from behind the blocks. Scale (not y) since x/y on cols and grid
      // are already owned by the mousemove parallax quickTo's above.
      const exitT = gsap.utils.clamp(0, 1, t / 0.5);
      gsap.set(cols, {
        opacity: 1 - exitT,
        scale: gsap.utils.interpolate(1, 0.96, exitT),
      });
      gsap.set(grid, {
        opacity: 1 - exitT,
        scale: gsap.utils.interpolate(1, 1.06, exitT),
      });

      gsap.set(section, { display: t >= 1 ? "none" : "" });
      window.dispatchEvent(
        new CustomEvent("whatido:progress", { detail: { progress: t } }),
      );
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      if (onBarShrink) window.removeEventListener("hero:bar-shrink", onBarShrink);
      cleanupMousemove?.();
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section
      className="whatido fixed inset-0 h-screen w-screen"
      id="whatido-section"
      data-stack
      data-no-close-clip
    >
      <div className="whatido__grid" id="whatido-grid" aria-hidden="true"></div>
      <div className="whatido__inner" id="whatido-inner">
        <div className="whatido__col whatido__col--left" id="whatido-col-left">
          <h2 className="whatido__title" id="whatido-title-left">
            <AnimatedLetters text={leftTitle} prefix="whatido" />
          </h2>
          <div className="whatido__divider" aria-hidden="true"></div>
          <p className="whatido__text" id="whatido-text-left">
            <AnimatedWords text={leftText} prefix="whatido" />
          </p>
        </div>

        <div className="whatido__col whatido__col--right" id="whatido-col-right">
          <h2 className="whatido__title" id="whatido-title-right">
            <AnimatedLetters text={rightTitle} prefix="whatido" />
          </h2>
          <div className="whatido__divider" aria-hidden="true"></div>
          <p className="whatido__text" id="whatido-text-right">
            <AnimatedWords text={rightText} prefix="whatido" />
          </p>
        </div>
      </div>
    </section>
  );
}
