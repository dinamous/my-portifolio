import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { scrubTimeline } from "../../lib/scrub";
import AnimatedLetters from "../../components/AnimatedLetters";
import "./Projects.css";

// ponytail: dados de projeto placeholder, trocar por projetos/imagens reais depois
const projects = [
  { index: "01", title: "Aurora", tag: "Motion / WebGL" },
  { index: "02", title: "Vórtice", tag: "Interação / GSAP" },
  { index: "03", title: "Prisma", tag: "3D / Three.js" },
  { index: "04", title: "Éter", tag: "Branding / Astro" },
];

export default function Projects() {
  useEffect(() => {
    const section = document.getElementById("projects-section")!;
    const label = document.getElementById("projects-label")!;
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".projects__row"));

    const reduceMotion = prefersReducedMotion();

    let onAboutmeProgress: EventListener | undefined;
    const rowCleanups: Array<() => void> = [];

    if (reduceMotion) {
      gsap.set(label, { opacity: 1 });
      gsap.set(rows, { opacity: 1, y: 0 });
      gsap.set(section.querySelectorAll(".projects__letter"), { y: 0, opacity: 1 });
    } else {
      gsap.set(label, { opacity: 0 });
      gsap.set(rows, { opacity: 0, y: 24 });
      gsap.set(section.querySelectorAll(".projects__letter"), { yPercent: 100, opacity: 0 });

      const reveal = gsap
        .timeline({ paused: true })
        .to(label, { opacity: 1, duration: 0.4 }, 0);

      rows.forEach((row, i) => {
        const letters = row.querySelectorAll(".projects__letter");
        reveal
          .to(row, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.1 + i * 0.12)
          .to(letters, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.02, ease: "power2.out" }, "<");
      });

      const setProgress = scrubTimeline(reveal);

      // waits until AboutMe's content has fully exited (its own EXIT_END) before this
      // section's elements start appearing — the two transitions never overlap, this
      // one only starts as AboutMe's curtain begins to dissolve.
      const REVEAL_DELAY = 0.7;
      onAboutmeProgress = ((e: CustomEvent<{ progress: number }>) => {
        const revealT = gsap.utils.clamp(
          0,
          1,
          (e.detail.progress - REVEAL_DELAY) / (1 - REVEAL_DELAY),
        );
        setProgress(revealT);
      }) as EventListener;
      window.addEventListener("aboutme:progress", onAboutmeProgress);

      // microinteracoes: pull magnetico na linha, thumb com wipe + scan no hover,
      // faixa sob o titulo — tudo via GSAP (mouseenter/mouseleave), sem CSS transition
      rows.forEach((row) => {
        const thumb = row.querySelector<HTMLElement>(".projects__thumb");
        const scan = row.querySelector<HTMLElement>(".projects__thumb-scan");
        const underline = row.querySelector<HTMLElement>(".projects__title-underline");
        const moveX = gsap.quickTo(row, "x", { duration: 0.5, ease: "power3" });

        const onMousemove = (e: MouseEvent) => {
          const rect = row.getBoundingClientRect();
          const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
          moveX(dx * 12);
        };
        const onMouseenter = () => {
          gsap.to(thumb, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.out" });
          gsap.to(underline, { scaleX: 1, duration: 0.4, ease: "power3.out" });
          gsap.fromTo(
            scan,
            { opacity: 0.5, yPercent: 100 },
            { opacity: 0, yPercent: -100, duration: 0.6, ease: "power2.out" },
          );
        };
        const onMouseleave = () => {
          moveX(0);
          gsap.to(thumb, { clipPath: "inset(50% 0% 50% 0%)", duration: 0.4, ease: "power2.inOut" });
          gsap.to(underline, { scaleX: 0, duration: 0.3, ease: "power2.inOut" });
        };

        row.addEventListener("mousemove", onMousemove);
        row.addEventListener("mouseenter", onMouseenter);
        row.addEventListener("mouseleave", onMouseleave);
        rowCleanups.push(() => {
          row.removeEventListener("mousemove", onMousemove);
          row.removeEventListener("mouseenter", onMouseenter);
          row.removeEventListener("mouseleave", onMouseleave);
        });
      });
    }

    // saída própria da Projects: é uma lista, então sair "in cascata" (linhas
    // deslizando pra fora em sequência) tem mais identidade que um fade genérico —
    // distinto do fade da AboutMe e do glitch que a Skills vai usar. Timeline
    // pausada escrubada pelo progresso, mesmo idiom da entrada (aboutme:progress).
    // data-no-close-clip tira essa seção do fechamento genérico do sectionStack.
    const exit = gsap.timeline({ paused: true }).to(label, { opacity: 0, duration: 0.3 }, 0);
    rows.forEach((row, i) => {
      exit.to(row, { x: -100, opacity: 0, duration: 0.5, ease: "power2.in" }, i * 0.08);
    });

    const setExitProgress = scrubTimeline(exit, { duration: 0.4 });

    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;
      if (reduceMotion) {
        gsap.set(rows, { opacity: 1 - p });
        gsap.set(label, { opacity: 1 - p });
      } else {
        setExitProgress(p);
      }
      // a lista some em cascata primeiro; só no fim da faixa o próprio fundo
      // sólido da seção desvanece — sem isso o fundo ficaria opaco até o corte
      // seco do display:none, escondendo a Skills por baixo até o último instante.
      const bgFadeT = gsap.utils.clamp(0, 1, (p - 0.75) / 0.25);
      gsap.set(section, { opacity: 1 - bgFadeT, display: p >= 1 ? "none" : "" });
      window.dispatchEvent(new CustomEvent("projects:progress", { detail: { progress: p } }));
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      if (onAboutmeProgress) window.removeEventListener("aboutme:progress", onAboutmeProgress);
      rowCleanups.forEach((fn) => fn());
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section className="projects fixed inset-0 h-screen w-screen" id="projects-section" data-stack data-no-close-clip>
      <div className="projects__label" id="projects-label">&lt;Trabalhos <span className="projects__label-slash">/</span>&gt;</div>
      <ul className="projects__list" id="projects-list">
        {projects.map((p, i) => (
          <li className="projects__row" id={`projects-row-${i}`} key={p.index}>
            <span className="projects__index">{`{ pj:${p.index} }`}</span>
            <h3 className="projects__title">
              <AnimatedLetters text={p.title} prefix="projects" />
              <span className="projects__title-underline" aria-hidden="true"></span>
            </h3>
            <span className="projects__tag">{p.tag}</span>
            <div className="projects__thumb" aria-hidden="true">
              <div className="projects__thumb-fill"></div>
              <div className="projects__thumb-scan"></div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
