import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { projects } from "../../lib/projects";
import { projectPath } from "../../lib/router";
import AnimatedLetters from "../../components/AnimatedLetters";
import "./Projects.css";

// tags reais viram o conteúdo do marquee do header — sem lista redundante hardcoded
const marqueeItems = Array.from(new Set(projects.flatMap((p) => p.tag.split(" / "))));

// poucos projetos ficam espaçosos e centralizados ("cozy"); a partir de 5 o
// layout compacta e o excedente vira scroll interno (ver LIST_T no efeito)
// em vez de encolher fonte/thumb até ficar ilegível.
const density = projects.length > 4 ? "compact" : "cozy";

// row é um <a href> de verdade (ctrl/cmd/middle-click abrem em nova aba do jeito
// normal do navegador); só intercepta o clique simples pra rodar a transição GSAP
// do ProjectDetail em vez de uma navegação de página cheia.
function handleOpenProject(e: ReactMouseEvent<HTMLAnchorElement>, slug: string, active: boolean) {
  // active vem do mesmo revealT/exitLocal que a animação usa — bloqueia o clique
  // (inclusive ctrl/cmd-click) enquanto a row ainda não terminou de aparecer ou já
  // começou a sair, sem depender de pointer-events (isso quebrava o hover, ver pill).
  if (!active) {
    e.preventDefault();
    return;
  }
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.dispatchEvent(new CustomEvent("project:open", { detail: { slug, x: e.clientX, y: e.clientY } }));
}

export default function Projects() {
  const activeRef = useRef(false);

  useEffect(() => {
    const section = document.getElementById("projects-section")!;
    const header = document.getElementById("projects-header")!;
    const headerLetters = document.querySelectorAll<HTMLElement>("#projects-heading .projects__letter");
    const listViewport = document.getElementById("projects-list-viewport")!;
    const list = document.getElementById("projects-list")!;
    const marqueeTrack = document.getElementById("projects-marquee-track");
    const progressFill = document.getElementById("projects-progress-fill");
    const progressIndex = document.getElementById("projects-progress-index");
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".projects__row"));
    // cascata de entrada/saída se estica por linha (i * delay); com muitas linhas
    // isso empurraria a reveal das últimas pra quase o fim do scrub — encurta o
    // delay conforme a lista cresce pra manter a cascata inteira legível.
    const rowRevealStagger = Math.min(0.12, 1.6 / rows.length);
    const rowExitStagger = Math.min(0.08, 1.2 / rows.length);

    // quanto da lista fica escondido abaixo da viewport fixa da seção — se
    // sobrar altura (poucos projetos, "cozy"), não há o que revelar por scroll.
    const maxScroll = Math.max(0, list.scrollHeight - listViewport.clientHeight);
    // fração do progresso local desta seção dedicada a revelar as linhas
    // excedentes antes da cascata de saída começar a mexer no header/linhas.
    const LIST_T = maxScroll > 0 ? 0.35 : 0;

    gsap.set(progressFill, { scaleY: maxScroll > 0 ? 0 : 1 });
    if (progressIndex) progressIndex.textContent = "01";

    const reduceMotion = prefersReducedMotion();

    let onAboutmeProgress: EventListener | undefined;
    const rowCleanups: Array<() => void> = [];
    let marqueeTween: gsap.core.Tween | undefined;
    let pillTl: gsap.core.Timeline | undefined;
    let reveal: gsap.core.Timeline | undefined;
    let revealFired = false;
    let hasEntered = false;
    let exitStarted = false;

    // AboutMe é um curtain com pointer-events:none no wrapper inteiro (deixa o
    // clique vazar pro que está embaixo) e as rows já existem no DOM antes da
    // própria entrada terminar — sem isso, dá pra "clicar através" da AboutMe numa
    // row que ainda nem apareceu. activeRef (lido no onClick/onMouseenter) só liga
    // quando a entrada (revealT) terminou e a saída ainda não começou; não mexe em
    // pointer-events porque isso interferia no disparo nativo de mouseenter/leave.
    const syncActive = () => {
      const next = hasEntered && !exitStarted;
      if (next === activeRef.current) return;
      activeRef.current = next;
      // liga/desliga o cursor:none junto (ver .projects__list--active no CSS) — sem
      // isso o cursor nativo sumia mesmo fora da janela em que a pill pode aparecer.
      list.classList.toggle("projects__list--active", next);
    };
    syncActive();

    if (marqueeTrack && !reduceMotion) {
      marqueeTween = gsap.to(marqueeTrack, {
        xPercent: -50,
        duration: Math.max(8, marqueeItems.length * 1.8),
        ease: "none",
        repeat: -1,
      });
    }

    if (reduceMotion) {
      gsap.set(header, { opacity: 1, y: 0 });
      gsap.set(rows, { opacity: 1, y: 0 });
      gsap.set(section.querySelectorAll(".projects__letter"), { y: 0, opacity: 1 });
    } else {
      gsap.set(header, { opacity: 0, y: -16 });
      gsap.set(rows, { opacity: 0, y: 40, x: -24 });
      gsap.set(section.querySelectorAll(".projects__letter"), { yPercent: 100, opacity: 0 });

      reveal = gsap
        .timeline({
          paused: true,
          // hover/clique liberam pelo fim da própria timeline, não por um limiar de
          // scroll — é o que tira a dependência de "rolar até tal ponto"
          onComplete: () => {
            hasEntered = true;
            syncActive();
          },
        })
        .to(header, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0)
        .to(headerLetters, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.025, ease: "power2.out" }, 0.05);

      rows.forEach((row, i) => {
        const letters = row.querySelectorAll(".projects__letter");
        reveal!
          // slingshot: back.out passa do alvo e volta — a row é "atirada" pra dentro
          // em vez de deslizar; x junto com y dá a diagonal do estilingue
          .to(row, { opacity: 1, y: 0, x: 0, duration: 0.7, ease: "back.out(1.7)" }, 0.1 + i * rowRevealStagger)
          .to(letters, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.02, ease: "power2.out" }, "<");
      });

      // seta que segue o cursor no hover — um único elemento compartilhado
      // por todas as rows (não um por row), seguindo via quickTo (retarget contínuo,
      // não gsap.to() novo por mousemove) e mostrado/escondido pela mesma técnica de
      // play/reverse usada abaixo pro thumb, para não herdar o bug de hover "preso".
      const pill = document.getElementById("projects-cursor-pill");
      let pillX: gsap.QuickToFunc | undefined;
      let pillY: gsap.QuickToFunc | undefined;
      if (pill) {
        // xPercent/yPercent centralizam no próprio tamanho (setado uma vez só);
        // x/y (abaixo) seguem o cursor em px puro — misturar isso com um
        // transform:translate(-50%,-50%) do CSS confundiria o parse do GSAP
        gsap.set(pill, { autoAlpha: 0, scale: 0.6, xPercent: -50, yPercent: -50 });
        pillX = gsap.quickTo(pill, "x", { duration: 0.35, ease: "power3" });
        pillY = gsap.quickTo(pill, "y", { duration: 0.35, ease: "power3" });
        pillTl = gsap.timeline({ paused: true }).to(pill, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power3.out" }, 0);
      }

      // microinteracoes: pull magnetico na linha, thumb com wipe + scan no hover,
      // faixa sob o titulo — tudo via GSAP (mouseenter/mouseleave), sem CSS transition.
      // thumb/underline tocam de uma timeline pausada única (.play()/.reverse()) em vez
      // de um gsap.to() novo por evento — passar o mouse rápido entre linhas dispara
      // enter+leave a poucos ms de distância, e um gsap.to() por evento nessa janela
      // fica "preso" no valor do primeiro (o overwrite "auto" só resolve no primeiro
      // tick do tween novo, não na criação); play/reverse na mesma timeline não disputa
      // a propriedade com ninguém, só muda de direção.
      rows.forEach((row) => {
        const thumb = row.querySelector<HTMLElement>(".projects__thumb");
        const scan = row.querySelector<HTMLElement>(".projects__thumb-scan");
        const underline = row.querySelector<HTMLElement>(".projects__title-underline");
        const moveX = gsap.quickTo(row, "x", { duration: 0.5, ease: "power3" });

        const hover = gsap
          .timeline({ paused: true })
          .to(thumb, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.out" }, 0)
          .to(underline, { scaleX: 1, duration: 0.4, ease: "power3.out" }, 0);

        const onMousemove = (e: MouseEvent) => {
          const rect = row.getBoundingClientRect();
          const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
          moveX(dx * 12);
          pillX?.(e.clientX);
          pillY?.(e.clientY);
        };
        const onMouseenter = (e: MouseEvent) => {
          if (!activeRef.current) return;
          hover.play();
          if (pill) gsap.set(pill, { x: e.clientX, y: e.clientY });
          pillTl?.play();
          // flash de "scan" é um efeito de disparo único (não um estado pra reverter),
          // por isso fica fora da timeline play/reverse acima
          gsap.fromTo(
            scan,
            { opacity: 0.5, yPercent: 100 },
            { opacity: 0, yPercent: -100, duration: 0.6, ease: "power2.out", overwrite: true },
          );
        };
        const onMouseleave = () => {
          moveX(0);
          hover.reverse();
          pillTl?.reverse();
        };

        row.addEventListener("mousemove", onMousemove);
        row.addEventListener("mouseenter", onMouseenter);
        row.addEventListener("mouseleave", onMouseleave);
        rowCleanups.push(() => {
          row.removeEventListener("mousemove", onMousemove);
          row.removeEventListener("mouseenter", onMouseenter);
          row.removeEventListener("mouseleave", onMouseleave);
          hover.kill();
        });
      });
    }

    // waits until AboutMe's content has fully exited (its own EXIT_END) before this
    // section's elements start appearing — the two transitions never overlap, this
    // one only starts as AboutMe's curtain begins to dissolve. Roda em ambos os modos
    // de motion (não só no else acima) porque também é o que libera o clique/hover.
    // ponytail: gatilho, não scrub — passou do limiar a entrada roda sozinha até o
    // fim (e reverte inteira se o usuário voltar), então o hover fica disponível sem
    // exigir que ele role até o final do range da AboutMe.
    const REVEAL_DELAY = 0.7;
    onAboutmeProgress = ((e: CustomEvent<{ progress: number }>) => {
      const past = e.detail.progress >= REVEAL_DELAY;
      if (past === revealFired) return;
      revealFired = past;
      if (past) {
        if (reveal) reveal.play();
        else {
          hasEntered = true; // reduced motion: nada pra animar, libera direto
          syncActive();
        }
      } else {
        hasEntered = false;
        syncActive();
        reveal?.reverse();
      }
    }) as EventListener;
    window.addEventListener("aboutme:progress", onAboutmeProgress);

    // saída própria da Projects: é uma lista, então sair "in cascata" (linhas
    // atiradas pra fora em sequência) tem mais identidade que um fade genérico —
    // distinto do fade da AboutMe e do glitch que a Skills vai usar. Mesmo idiom da
    // entrada: gatilho, não scrub — cruzou o limiar a cascata roda inteira sozinha,
    // e voltar o scroll a reverte inteira, sem estado intermediário preso ao wheel.
    // data-no-close-clip tira essa seção do fechamento genérico do sectionStack.
    // a Skills escruba a entrada dela no projects:progress, então o que sai daqui é o
    // progresso da própria timeline (não o do scroll) — as duas ficam em sincronia
    // mesmo com a saída rodando sozinha.
    const emitProgress = () =>
      window.dispatchEvent(new CustomEvent("projects:progress", { detail: { progress: exit.progress() } }));

    const exit = gsap
      .timeline({
        paused: true,
        onUpdate: emitProgress,
        onComplete: () => {
          gsap.set(section, { display: "none" });
          emitProgress();
        },
      })
      .to(header, { opacity: 0, y: -16, duration: 0.3 }, 0);
    rows.forEach((row, i) => {
      // slingshot de saída: back.in recua um instante antes de arremessar a row
      exit.to(row, { x: -140, opacity: 0, duration: 0.55, ease: "back.in(1.6)" }, i * rowExitStagger);
    });
    // a lista some em cascata primeiro; o fundo sólido da seção dissolve por cima do
    // fim dela. Começa junto com a última row (não depois): a entrada da Skills é
    // escrubada nesse mesmo trecho, e com o fundo opaco até o fim ela se montava
    // escondida atrás dele e só aparecia pronta.
    exit.to(section, { opacity: 0, duration: 0.7 }, ">-0.45");
    // ponytail: tween vazio só pra estender a duração. A Skills escruba a entrada dela
    // em `projects:progress`, que acaba junto com esta timeline — sem esta cauda a
    // revelação dela teria que caber inteira dentro do fade acima, ou seja, atrás de um
    // fundo ainda opaco. É também o botão de ritmo da entrada da Skills: é aqui que se
    // alonga ou encurta a cascata dela, não nas janelas de progresso do outro arquivo.
    exit.to({}, { duration: 1.1 });

    const EXIT_TRIGGER = Math.max(LIST_T, 0.06);
    let exitFired = false;

    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;

      // fase de "navegação": antes de qualquer coisa sair, o excedente da lista
      // (além do que cabe na viewport) desliza pra cima revelado por scroll —
      // header e linhas visíveis continuam intactos até essa fase acabar. Essa
      // continua escrubada de propósito: aqui o scroll está navegando a lista.
      const browseT = maxScroll > 0 ? gsap.utils.clamp(0, 1, p / LIST_T) : 1;
      gsap.set(list, { y: -maxScroll * browseT });
      gsap.set(progressFill, { scaleY: browseT });
      if (progressIndex) {
        const activeIndex = Math.min(rows.length, Math.max(1, Math.round(1 + browseT * (rows.length - 1))));
        progressIndex.textContent = String(activeIndex).padStart(2, "0");
      }

      const past = p >= EXIT_TRIGGER;
      if (past === exitFired) return;
      exitFired = past;
      exitStarted = past;
      syncActive();

      if (reduceMotion) {
        exit.progress(past ? 1 : 0);
        gsap.set(section, { display: past ? "none" : "" });
        emitProgress();
        return;
      }
      if (past) exit.play();
      else {
        gsap.set(section, { display: "" });
        exit.reverse();
      }
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      if (onAboutmeProgress) window.removeEventListener("aboutme:progress", onAboutmeProgress);
      rowCleanups.forEach((fn) => fn());
      reveal?.kill();
      exit.kill();
      marqueeTween?.kill();
      pillTl?.kill();
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section
      className="projects fixed inset-0 h-screen w-screen"
      id="projects-section"
      data-stack
      data-no-close-clip
      data-density={density}
    >
      <header className="projects__header" id="projects-header">
        <h2 className="projects__heading" id="projects-heading">
          <AnimatedLetters text="Projetos" prefix="projects" />
        </h2>
        <div className="projects__meta">
          <div className="projects__marquee" aria-hidden="true">
            <div className="projects__marquee-track" id="projects-marquee-track">
              {[0, 1].map((copy) => (
                <span className="projects__marquee-row" key={copy}>
                  {marqueeItems.map((item, i) => (
                    <span className="projects__marquee-item" key={`${copy}-${item}-${i}`}>
                      {item}
                      <span className="projects__marquee-star" aria-hidden="true">
                        ✦
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <div className="projects__progress">
            <span className="projects__progress-index" id="projects-progress-index">
              01
            </span>
            <span className="projects__progress-track" aria-hidden="true">
              <span className="projects__progress-fill" id="projects-progress-fill"></span>
            </span>
            <span className="projects__progress-total">{String(projects.length).padStart(2, "0")}</span>
          </div>
        </div>
      </header>
      <div className="projects__list-viewport" id="projects-list-viewport">
        <ul className="projects__list" id="projects-list">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <a
                className="projects__row"
                id={`projects-row-${i}`}
                href={projectPath(p.slug)}
                onClick={(e) => handleOpenProject(e, p.slug, activeRef.current)}
              >
                <h3 className="projects__title">
                  <AnimatedLetters text={p.title} prefix="projects" />
                  <span className="projects__title-underline" aria-hidden="true"></span>
                </h3>
                <div className="projects__thumb" aria-hidden="true">
                  <img className="projects__thumb-img" src={p.images[0]} alt="" loading="lazy" />
                  <div className="projects__thumb-overlay"></div>
                  <div className="projects__thumb-scan"></div>
                </div>
                <span className="projects__tag">{p.tag}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="projects__cursor-pill" id="projects-cursor-pill" aria-hidden="true">
        <svg className="projects__cursor-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18 18 6" />
          <path d="M8.5 6H18v9.5" />
        </svg>
      </div>
    </section>
  );
}
