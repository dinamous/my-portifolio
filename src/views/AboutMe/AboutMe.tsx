import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import "./AboutMe.css";

export default function AboutMe() {
  useEffect(() => {
    const section = document.getElementById("aboutme-section")!;
    const blockTop = document.getElementById("aboutme-block-top")!;
    const blockBottom = document.getElementById("aboutme-block-bottom")!;
    const backdrop = document.getElementById("aboutme-backdrop")!;
    const glow = document.getElementById("aboutme-glow")!;
    const portraitWrap = document.getElementById("aboutme-portrait-wrap")!;
    const portrait = document.getElementById("aboutme-portrait")!;
    const content = document.getElementById("aboutme-content")!;
    const kicker = document.getElementById("aboutme-kicker")!;
    const divider = document.getElementById("aboutme-divider")!;
    const text = document.getElementById("aboutme-text")!;
    const lines = content.querySelectorAll<HTMLElement>(".aboutme__inner");
    const kickerRevs = kicker.querySelectorAll<HTMLElement>(".aboutme__rev");

    const reduceMotion = prefersReducedMotion();

    // ponytail: no reduced-motion branch splitting this setup from the reveal logic below —
    // .aboutme keeps z-index:20 so its curtain can render above Hero/WhatIDo while they're
    // still on screen mid-transition (their own natural z-index, assigned by sectionStack.ts,
    // would otherwise cover it). That only stays correct as long as AboutMe starts hidden like
    // every other section; jumping straight to opacity:1 here (as reduced motion used to) meant
    // AboutMe's forced z-index put it on top of Hero/WhatIDo from the very first frame, instead
    // of waiting its turn. The reveal below is pure gsap.set driven off scroll progress (no
    // tweening), so it's safe to run unconditionally — same idiom as Hero's own stack:progress
    // handler, which also updates unconditionally in both motion modes.
    gsap.set(blockTop, { xPercent: -100 });
    gsap.set(blockBottom, { xPercent: 100 });
    gsap.set([backdrop, glow, portraitWrap, content], { opacity: 0 });
    gsap.set(portraitWrap, { y: 50, scale: 1.05 });
    gsap.set(content, { y: 32 });
    gsap.set(portrait, { clipPath: "inset(46% 0% 46% 0%)" });
    gsap.set(lines, { yPercent: 120 });
    gsap.set(kickerRevs, { y: 18, opacity: 0 });
    gsap.set(divider, { scaleX: 0 });
    gsap.set(text, { y: 18, opacity: 0 });

    // reveals element i of a group across its own slice of the segment (1/count wide),
    // in order — same manually-scrubbed stand-in for gsap stagger used in WhatIDo.astro,
    // since this whole reveal is driven off a single continuous progress value.
    const seqT = (segT: number, index: number, count: number) =>
      gsap.utils.clamp(0, 1, segT * count - index);

    const coverEase = gsap.parseEase("power2.out");

    // tracks WhatIDo's own progress so the exit handler below can tell "not entered
    // yet" (t < 1, p also reads 0 the whole time) apart from "entered and at rest"
    // (t === 1, p also reads 0) — both clamp p to 0, so p alone can't distinguish them.
    let enteredT = 0;

    // curtain blocks wait offscreen through a short delay, then glide in — easing out as
    // they approach — until each one fully covers its half of the screen and locks there,
    // becoming the solid background the content reveals onto. They never exit; revealT
    // picks up right after coverT completes.
    const onWhatIdoProgress = ((e: CustomEvent<{ progress: number }>) => {
      const t = e.detail.progress;
      enteredT = t;
      const coverT = coverEase(gsap.utils.clamp(0, 1, (t - 0.15) / 0.45));
      const revealT = gsap.utils.clamp(0, 1, (t - 0.6) / 0.4);

      gsap.set(blockTop, { xPercent: gsap.utils.interpolate(-100, 0, coverT) });
      gsap.set(blockBottom, { xPercent: gsap.utils.interpolate(100, 0, coverT) });

      const backdropT = gsap.utils.clamp(0, 1, revealT / 0.15);
      gsap.set(backdrop, { opacity: backdropT });

      const glowT = gsap.utils.clamp(0, 1, revealT / 0.35);
      gsap.set(glow, { opacity: glowT });

      const portraitT = gsap.utils.clamp(0, 1, (revealT - 0.05) / 0.5);
      gsap.set(portraitWrap, {
        opacity: portraitT,
        y: gsap.utils.interpolate(50, 0, portraitT),
        scale: gsap.utils.interpolate(1.05, 1, portraitT),
      });
      const clipInset = gsap.utils.interpolate(46, 0, portraitT);
      gsap.set(portrait, { clipPath: `inset(${clipInset}% 0% ${clipInset}% 0%)` });

      const contentT = gsap.utils.clamp(0, 1, (revealT - 0.25) / 0.6);
      gsap.set(content, {
        opacity: contentT > 0 ? 1 : 0,
        y: gsap.utils.interpolate(32, 0, contentT),
      });

      const kickerT = gsap.utils.clamp(0, 1, contentT / 0.3);
      kickerRevs.forEach((el, i) => {
        const kt = seqT(kickerT, i, kickerRevs.length);
        gsap.set(el, { y: gsap.utils.interpolate(18, 0, kt), opacity: kt });
      });

      const linesT = gsap.utils.clamp(0, 1, (contentT - 0.2) / 0.5);
      lines.forEach((el, i) => {
        const lt = seqT(linesT, i, lines.length);
        gsap.set(el, { yPercent: gsap.utils.interpolate(120, 0, lt) });
      });

      const dividerT = gsap.utils.clamp(0, 1, (contentT - 0.55) / 0.3);
      gsap.set(divider, { scaleX: dividerT });

      const textT = gsap.utils.clamp(0, 1, (contentT - 0.65) / 0.35);
      gsap.set(text, { opacity: textT, y: gsap.utils.interpolate(18, 0, textT) });
    }) as EventListener;
    window.addEventListener("whatido:progress", onWhatIdoProgress);

    let cleanupMousemove: (() => void) | undefined;
    if (!reduceMotion) {
      // subtle mouse parallax across the revealed scene — listens on window (not the
      // section) since .aboutme keeps pointer-events:none for its whole top-layer curtain.
      // glow drifts opposite the cursor (background layer), portrait/content drift with
      // it (foreground) — same layered-opposition idiom as WhatIDo's grid vs. columns.
      const gX = gsap.quickTo(glow, "x", { duration: 1.3, ease: "power3" });
      const gY = gsap.quickTo(glow, "y", { duration: 1.3, ease: "power3" });
      const pX = gsap.quickTo(portraitWrap, "x", { duration: 1.0, ease: "power3" });
      const pY = gsap.quickTo(portraitWrap, "y", { duration: 1.0, ease: "power3" });
      const cX = gsap.quickTo(content, "x", { duration: 1.0, ease: "power3" });

      const onMousemove = (e: MouseEvent) => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        gX(-dx * 30);
        gY(-dy * 24);
        pX(dx * 16);
        pY(dy * 12);
        cX(dx * 10);
      };
      window.addEventListener("mousemove", onMousemove);
      cleanupMousemove = () => window.removeEventListener("mousemove", onMousemove);
    }

    // saída própria da AboutMe: um scroll de respiro (EXIT_HOLD) segura o conteúdo
    // totalmente visível antes de qualquer saída começar, depois cada elemento sai com
    // o movimento inverso do que usou pra entrar (kicker/linhas deslizam pra cima,
    // portrait fecha o clip de volta, divider recolhe a scaleX, etc.), cada um na sua
    // própria janela de `et` — não um fadeout único. Todo o conteúdo termina de sair
    // em EXIT_END; só depois disso a
    // cortina sólida (aboutme__block--top/bottom, que não se move aqui) dissolve pra
    // revelar Projects — Projects.tsx só começa a revelar seus próprios elementos a
    // partir desse mesmo ponto (REVEAL_DELAY), então as duas transições nunca se
    // sobrepõem. data-no-close-clip tira essa seção do fechamento genérico do
    // sectionStack (que brigaria com esse fade fazendo clip-path ao mesmo tempo).
    const EXIT_HOLD = 0.25; // scroll "de respiro": conteúdo fica parado, totalmente visível, antes de começar a sair
    const EXIT_END = 0.7; // mais espaço de scroll pra saída, pra não ficar rápida
    const exitEase = gsap.parseEase("power2.inOut"); // suaviza começo/fim de cada saída em vez do corte seco do clamp linear
    const exitLocalT = (start: number, span: number, et: number) =>
      exitEase(gsap.utils.clamp(0, 1, (et - start) / span));

    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;

      // p alone reads 0 both "before WhatIDo has handed off" and "just after entering,
      // at rest" — without this guard, et (0 - 1) - 0 forces opacity back to 1 on
      // every scroll tick from the very first pixel, even while still inside Hero.
      if (enteredT >= 1) {
        const et = gsap.utils.clamp(0, 1, (p - EXIT_HOLD) / (EXIT_END - EXIT_HOLD));

        const kickerT = exitLocalT(0, 0.4, et);
        kickerRevs.forEach((el, i) => {
          const kt = seqT(kickerT, i, kickerRevs.length);
          gsap.set(el, { y: gsap.utils.interpolate(0, -18, kt), opacity: 1 - kt });
        });

        const linesT = exitLocalT(0.05, 0.45, et);
        lines.forEach((el, i) => {
          const lt = seqT(linesT, i, lines.length);
          gsap.set(el, { yPercent: gsap.utils.interpolate(0, -120, lt) });
        });

        const dividerT = exitLocalT(0.15, 0.3, et);
        gsap.set(divider, { scaleX: 1 - dividerT });

        const textT = exitLocalT(0.2, 0.35, et);
        gsap.set(text, { opacity: 1 - textT, y: gsap.utils.interpolate(0, -18, textT) });

        const contentT = exitLocalT(0.35, 0.45, et);
        gsap.set(content, { opacity: 1 - contentT, y: gsap.utils.interpolate(0, -32, contentT) });

        const portraitT = exitLocalT(0.3, 0.5, et);
        gsap.set(portraitWrap, {
          opacity: 1 - portraitT,
          y: gsap.utils.interpolate(0, -50, portraitT),
          scale: gsap.utils.interpolate(1, 1.05, portraitT),
        });
        const clipInset = gsap.utils.interpolate(0, 46, portraitT);
        gsap.set(portrait, { clipPath: `inset(${clipInset}% 0% ${clipInset}% 0%)` });

        const glowT = exitLocalT(0.45, 0.4, et);
        gsap.set(glow, { opacity: 1 - glowT });

        const backdropT = exitLocalT(0.55, 0.45, et);
        gsap.set(backdrop, { opacity: 1 - backdropT });
      }

      const fadeT = gsap.utils.clamp(0, 1, (p - EXIT_END) / (1 - EXIT_END));
      gsap.set(section, { opacity: 1 - fadeT, display: p >= 1 ? "none" : "" });

      window.dispatchEvent(new CustomEvent("aboutme:progress", { detail: { progress: p } }));
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      window.removeEventListener("whatido:progress", onWhatIdoProgress);
      cleanupMousemove?.();
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section
      className="aboutme fixed inset-0 h-screen w-screen"
      id="aboutme-section"
      data-stack
      data-no-close-clip
    >
      {/* solid ground the content reveals onto — without it, the gaps between frame/backdrop
         would show WhatIDo's own (light) background once the curtain blocks exit */}
      <div className="aboutme__backdrop" id="aboutme-backdrop" aria-hidden="true"></div>

      <div className="aboutme__frame" id="aboutme-frame">
        <div className="aboutme__portrait-wrap" id="aboutme-portrait-wrap" aria-hidden="true">
          <div className="aboutme__glow" id="aboutme-glow"></div>
          <div className="aboutme__portrait" id="aboutme-portrait">
            <img className="aboutme__portrait-fill" src="/matheus.png" alt="" />
          </div>
        </div>

        <div className="aboutme__content" id="aboutme-content">
          <div className="aboutme__kicker" id="aboutme-kicker">
            <span className="aboutme__rev aboutme__index">02</span>
            <span className="aboutme__rev aboutme__label-slash">/</span>
            <span className="aboutme__rev aboutme__tag">Sobre</span>
          </div>

          <h2 className="aboutme__heading">
            <span className="aboutme__line"><span className="aboutme__inner">Não desenho telas.</span></span>
            <span className="aboutme__line"><span className="aboutme__inner">Componho movimento.</span></span>
            <span className="aboutme__line"
              ><span className="aboutme__inner"
                >Vida em cada <em className="aboutme__em">transição<span className="aboutme__accent">;</span></em></span
              ></span
            >
          </h2>

          <div className="aboutme__divider" id="aboutme-divider" aria-hidden="true"></div>

          <p className="aboutme__rev aboutme__text" id="aboutme-text">
            <span className="aboutme__tag-inline">&lt;about&gt;</span>Sou o Matheus, desenvolvedor{" "}
            <em className="aboutme__em">front-end</em> apaixonado por movimento. Dou vida a interfaces com
            animações, transições e modelagens 3D, sempre buscando fazer a tela deixar de ser estática.
            Para mim, código é matéria-prima; a <em className="aboutme__em">emoção</em> é o acabamento. Cada
            detalhe é pensado para ser sentido, não apenas visto.
          </p>
        </div>
      </div>

      <div className="aboutme__block aboutme__block--top" id="aboutme-block-top"></div>
      <div className="aboutme__block aboutme__block--bottom" id="aboutme-block-bottom"></div>
    </section>
  );
}
