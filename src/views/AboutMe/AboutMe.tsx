import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import AnimatedLetters from "../../components/AnimatedLetters";
import { AccentRule, CropMarks, DashedLine, Perforation, RegMark } from "../../components/graphics";
import "./AboutMe.css";

// ponytail: hardcoded até virar documento no Sanity (client já existe em src/lib/sanity.ts,
// ainda sem schema) — trocar este objeto por um fetch/props quando o `about` existir lá;
// só ele alimenta o bloco de infos, então a troca fica contida.
const about = {
  local: "São Paulo, Brasil",
  status: "Aberto pra oportunidades",
};

export default function AboutMe() {
  useEffect(() => {
    const section = document.getElementById("aboutme-section")!;
    const blockTop = document.getElementById("aboutme-block-top")!;
    const blockBottom = document.getElementById("aboutme-block-bottom")!;
    const backdrop = document.getElementById("aboutme-backdrop")!;
    const ticket = document.getElementById("aboutme-ticket")!;
    const photo = document.getElementById("aboutme-photo")!;
    const panel = document.getElementById("aboutme-panel")!;
    const sub = document.getElementById("aboutme-sub")!;
    const letters = section.querySelectorAll<HTMLElement>(".aboutme__letter");
    const marks = section.querySelectorAll<HTMLElement>(".aboutme__mark");
    const decos = section.querySelectorAll<HTMLElement>(".aboutme__deco");

    // ponytail: sem branch de reduced-motion neste setup — .aboutme mantém z-index:20 pra
    // cortina render acima de Hero/WhatIDo durante a transição, o que só continua correto
    // enquanto a seção começa escondida como todas as outras. A revelação abaixo é só
    // gsap.set em cima do progresso de scroll (nada tweenado), então roda nos dois modos.
    gsap.set(blockTop, { xPercent: -100 });
    gsap.set(blockBottom, { xPercent: 100 });
    gsap.set([backdrop, ticket, panel], { opacity: 0 });
    gsap.set(ticket, { x: -40 });
    gsap.set(panel, { y: 32 });
    gsap.set(photo, { clipPath: "inset(46% 0% 46% 0%)" });
    gsap.set(letters, { yPercent: 110, opacity: 0 });
    gsap.set(marks, { scale: 0.4, opacity: 0 });
    gsap.set(decos, { opacity: 0 });
    gsap.set(sub, { y: 18, opacity: 0 });

    // revela o elemento i de um grupo na sua própria fatia do segmento (1/count),
    // em ordem — stand-in manual do stagger do GSAP, já que tudo aqui é escrubado
    // a partir de um único valor contínuo de progresso.
    const seqT = (segT: number, index: number, count: number) =>
      gsap.utils.clamp(0, 1, segT * count - index);

    const stagger = (els: NodeListOf<HTMLElement>, t: number, fn: (el: HTMLElement, k: number) => void) =>
      els.forEach((el, i) => fn(el, seqT(t, i, els.length)));

    const coverEase = gsap.parseEase("power2.out");

    // guarda o progresso da WhatIDo pro handler de saída distinguir "ainda não entrou"
    // (t < 1, p também lê 0) de "entrou e está parada" (t === 1, p também lê 0).
    let enteredT = 0;
    // entrada e saída mexem nos mesmos elementos e o stack dispara os dois no mesmo
    // tick (WhatIDo vem antes desta seção no array), então sem esse flag as duas
    // escreviam as mesmas props no mesmo frame — dobro de trabalho e tremida na borda.
    let exiting = false;

    // as cortinas esperam fora da tela, entram e travam cobrindo cada metade — viram o
    // fundo sólido em que o conteúdo aparece. Nunca saem; revealT começa logo após coverT.
    const onWhatIdoProgress = ((e: CustomEvent<{ progress: number }>) => {
      const t = e.detail.progress;
      enteredT = t;
      if (exiting) return; // a saída já é dona desses elementos

      const coverT = coverEase(gsap.utils.clamp(0, 1, (t - 0.15) / 0.45));
      const revealT = gsap.utils.clamp(0, 1, (t - 0.6) / 0.4);

      gsap.set(blockTop, { xPercent: gsap.utils.interpolate(-100, 0, coverT) });
      gsap.set(blockBottom, { xPercent: gsap.utils.interpolate(100, 0, coverT) });

      gsap.set(backdrop, { opacity: gsap.utils.clamp(0, 1, revealT / 0.15) });

      const ticketT = gsap.utils.clamp(0, 1, (revealT - 0.05) / 0.5);
      gsap.set(ticket, { opacity: ticketT, x: gsap.utils.interpolate(-40, 0, ticketT) });
      const clipInset = gsap.utils.interpolate(46, 0, ticketT);
      gsap.set(photo, { clipPath: `inset(${clipInset}% 0% ${clipInset}% 0%)` });
      stagger(marks, gsap.utils.clamp(0, 1, (ticketT - 0.4) / 0.6), (el, k) =>
        gsap.set(el, { scale: gsap.utils.interpolate(0.4, 1, k), opacity: k }),
      );

      const panelT = gsap.utils.clamp(0, 1, (revealT - 0.25) / 0.6);
      // rampa curta em vez de flip binário: o fundo sólido do painel chega quase
      // imediato (era a intenção do `> 0 ? 1 : 0`) mas sem o pop de um frame
      gsap.set(panel, {
        opacity: gsap.utils.clamp(0, 1, panelT / 0.12),
        y: gsap.utils.interpolate(32, 0, panelT),
      });

      stagger(letters, gsap.utils.clamp(0, 1, panelT / 0.6), (el, k) =>
        gsap.set(el, { yPercent: gsap.utils.interpolate(110, 0, k), opacity: k }),
      );
      stagger(decos, gsap.utils.clamp(0, 1, (panelT - 0.3) / 0.7), (el, k) => gsap.set(el, { opacity: k }));

      const subT = gsap.utils.clamp(0, 1, (panelT - 0.6) / 0.4);
      gsap.set(sub, { opacity: subT, y: gsap.utils.interpolate(18, 0, subT) });
    }) as EventListener;
    window.addEventListener("whatido:progress", onWhatIdoProgress);

    let cleanupMousemove: (() => void) | undefined;
    if (!prefersReducedMotion()) {
      // parallax leve: os dois blocos deslizam em oposição, dando profundidade à "ficha".
      // xPercent, não x: o `x` do ticket é reescrito pelo scroll a cada tick (entrada e
      // saída) — dois donos da mesma prop era a tremida. O GSAP soma x e xPercent no
      // mesmo translate, então cada fonte fica com o seu canal e ninguém sobrescreve
      // ninguém. Valores em % da largura do próprio bloco (~14px e ~10px no desktop).
      const tX = gsap.quickTo(ticket, "xPercent", { duration: 1.2, ease: "power3" });
      const pX = gsap.quickTo(panel, "xPercent", { duration: 1.2, ease: "power3" });
      const onMousemove = (e: MouseEvent) => {
        // só com a seção parada na tela: durante entrada/saída o movimento já é do scroll
        if (enteredT < 1 || exiting) return;
        const dx = e.clientX / window.innerWidth - 0.5;
        tX(dx * -3);
        pX(dx * 1.2);
      };
      window.addEventListener("mousemove", onMousemove, { passive: true });
      cleanupMousemove = () => window.removeEventListener("mousemove", onMousemove);
    }

    // saída própria: EXIT_HOLD segura tudo visível antes de qualquer coisa sair, depois
    // cada elemento sai pelo inverso do movimento de entrada, cada um na sua janela de `et`
    // — não um fade único. Tudo termina em EXIT_END; só então a cortina sólida dissolve
    // revelando a Projects (que começa a revelar a partir do mesmo ponto, REVEAL_DELAY),
    // então as duas transições nunca se sobrepõem. data-no-close-clip tira esta seção do
    // fechamento genérico do sectionStack (brigaria com esse fade).
    const EXIT_HOLD = 0.25;
    const EXIT_END = 0.7;
    const exitEase = gsap.parseEase("power2.inOut");
    const exitLocalT = (start: number, span: number, et: number) =>
      exitEase(gsap.utils.clamp(0, 1, (et - start) / span));

    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;

      // p sozinho lê 0 tanto antes da WhatIDo entregar quanto logo após entrar — sem esse
      // guard, et força opacity de volta a 1 a cada tick, ainda dentro da Hero.
      if (enteredT >= 1) {
        const et = gsap.utils.clamp(0, 1, (p - EXIT_HOLD) / (EXIT_END - EXIT_HOLD));

        stagger(letters, exitLocalT(0, 0.45, et), (el, k) =>
          gsap.set(el, { yPercent: gsap.utils.interpolate(0, -110, k), opacity: 1 - k }),
        );
        stagger(decos, exitLocalT(0.1, 0.4, et), (el, k) => gsap.set(el, { opacity: 1 - k }));

        const subT = exitLocalT(0.2, 0.35, et);
        gsap.set(sub, { opacity: 1 - subT, y: gsap.utils.interpolate(0, -18, subT) });

        const panelT = exitLocalT(0.35, 0.45, et);
        gsap.set(panel, { opacity: 1 - panelT, y: gsap.utils.interpolate(0, -32, panelT) });

        stagger(marks, exitLocalT(0.25, 0.35, et), (el, k) =>
          gsap.set(el, { scale: gsap.utils.interpolate(1, 0.4, k), opacity: 1 - k }),
        );

        const ticketT = exitLocalT(0.3, 0.5, et);
        gsap.set(ticket, { opacity: 1 - ticketT, x: gsap.utils.interpolate(0, -40, ticketT) });
        const clipInset = gsap.utils.interpolate(0, 46, ticketT);
        gsap.set(photo, { clipPath: `inset(${clipInset}% 0% ${clipInset}% 0%)` });

        const backdropT = exitLocalT(0.55, 0.45, et);
        gsap.set(backdrop, { opacity: 1 - backdropT });
      }

      const fadeT = gsap.utils.clamp(0, 1, (p - EXIT_END) / (1 - EXIT_END));
      // visibility, não display: o valor de p vem do quickTo do sectionStack, que
      // assenta/ultrapassa em volta de 1 — um flip de display nessa borda pisca. Aqui a
      // opacity já é 0 quando fadeT chega a 1, então a troca é invisível (e ainda tira a
      // seção do paint, que é o único motivo de esconder: .aboutme já é pointer-events:none)
      gsap.set(section, { opacity: 1 - fadeT, visibility: fadeT >= 1 ? "hidden" : "visible" });

      exiting = p > 0;
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
      {/* chão sólido em que o conteúdo aparece — sem ele, as frestas entre os dois blocos
         mostrariam o fundo (claro) da WhatIDo assim que a cortina para */}
      <div className="aboutme__backdrop" id="aboutme-backdrop" aria-hidden="true"></div>

      <div className="aboutme__frame">
        <aside className="aboutme__ticket" id="aboutme-ticket">
          <div className="aboutme__stub" aria-hidden="true">
            <Perforation vertical className="aboutme__stub-holes" />
            <span className="aboutme__arrows">↠</span>
            <span className="aboutme__stub-text">Matheus Simões</span>
            <span className="aboutme__arrows">↠</span>
            <DashedLine vertical className="aboutme__stub-edge" />
          </div>

          <div className="aboutme__ticket-body">
            <RegMark className="aboutme__mark" />

            <div className="aboutme__photo" id="aboutme-photo">
              <img className="aboutme__photo-img" src="/profile-picture.png" alt="Matheus Simões" />
              <CropMarks />
            </div>

            <div className="aboutme__info">
              <p className="aboutme__deco aboutme__info-line">Residindo em {about.local}</p>
              <p className="aboutme__deco aboutme__info-line">Status: {about.status}</p>
            </div>
          </div>
        </aside>

        <div className="aboutme__panel" id="aboutme-panel">
          {/* mesmas marcas de corte da foto, agora emoldurando o card de texto */}
          <CropMarks x="clamp(20px, 3vw, 56px)" y="clamp(20px, 3.5vh, 40px)" opacity={0.35} />

          <h2 className="aboutme__heading">
            <AnimatedLetters text="Componho movimento," prefix="aboutme" />
            <span className="aboutme__heading-break"></span>
            <AnimatedLetters text="não telas." prefix="aboutme" />
          </h2>

          <AccentRule className="aboutme__deco aboutme__rule" />

          <p className="aboutme__sub" id="aboutme-sub">
            Desenvolvedor front-end especializado em animação, interação e experiências 3D. Código é
            matéria-prima; a emoção é o acabamento. Cada detalhe pensado pra ser sentido, não só visto.
          </p>
        </div>
      </div>

      <div className="aboutme__block aboutme__block--top" id="aboutme-block-top"></div>
      <div className="aboutme__block aboutme__block--bottom" id="aboutme-block-bottom"></div>
    </section>
  );
}
