import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { lockSectionStack, unlockSectionStack } from "../../lib/sectionStack";
import { getProjectBySlug, type Project } from "../../lib/projects";
import { getSlugFromLocation, popProjectUrl, pushProjectUrl } from "../../lib/router";
import AnimatedLetters from "../../components/AnimatedLetters";
import "./ProjectDetail.css";

// overlay "página" de projeto: sempre montado (escuta project:open + a URL
// direta em /projetos/:slug), mas só ocupa a tela quando `project` existe.
// Abre/fecha com um clip-path circle() a partir do ponto clicado — é uma
// transição por cima do app, não uma navegação real, então nada por baixo
// (scroll da pilha, seções) é desmontado ou perdido.
export default function ProjectDetail() {
  const [project, setProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const originRef = useRef({ x: 0, y: 0 });
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion();
    originRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const open = (slug: string, x?: number, y?: number) => {
      const p = getProjectBySlug(slug);
      if (!p) return;
      if (x != null && y != null) originRef.current = { x, y };
      setSlideIndex(0);
      setProject(p);
      setIsOpen(true);
      lockSectionStack();
    };

    const initialSlug = getSlugFromLocation();
    if (initialSlug) open(initialSlug);

    const onOpenEvent = ((e: CustomEvent<{ slug: string; x: number; y: number }>) => {
      pushProjectUrl(e.detail.slug);
      open(e.detail.slug, e.detail.x, e.detail.y);
    }) as EventListener;
    window.addEventListener("project:open", onOpenEvent);

    const onPopState = () => {
      const slug = getSlugFromLocation();
      if (slug) open(slug);
      else {
        setIsOpen(false);
        unlockSectionStack();
      }
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("project:open", onOpenEvent);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const handleClose = () => {
    popProjectUrl();
    setIsOpen(false);
    unlockSectionStack();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen]);

  // clip-path circle() a partir do ponto de origem (clique na row, ou o centro
  // da tela numa carga direta da URL) — a única animação "de transição" daqui;
  // o conteúdo em si (título/descrição/techs/carrossel) usa React normal.
  useEffect(() => {
    const overlay = document.getElementById("projectdetail")!;
    const { x, y } = originRef.current;

    if (isOpen) {
      if (reduceMotionRef.current) {
        gsap.set(overlay, { clipPath: "circle(150% at 50% 50%)", autoAlpha: 1 });
      } else {
        // o que suaviza a íris é ela não aparecer sozinha: o overlay entra por opacity
        // ao mesmo tempo, então a borda dura do circle() nunca fica exposta.
        // ponytail: sem scale no #projectdetail-inner — ele é o conteúdo do container
        // que rola, e qualquer escala > 1 estoura os dois eixos e pisca scrollbar.
        gsap.set(overlay, { clipPath: `circle(0% at ${x}px ${y}px)`, autoAlpha: 0 });
        gsap
          .timeline()
          .to(overlay, { clipPath: `circle(150% at ${x}px ${y}px)`, duration: 1.1, ease: "power2.inOut" }, 0)
          .to(overlay, { autoAlpha: 1, duration: 0.45, ease: "power1.out" }, 0);
      }
    } else if (project) {
      if (reduceMotionRef.current) {
        gsap.set(overlay, { autoAlpha: 0 });
        setProject(null);
      } else {
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(overlay, { autoAlpha: 0 });
              setProject(null);
            },
          })
          .to(overlay, { clipPath: `circle(0% at ${x}px ${y}px)`, duration: 0.75, ease: "power2.inOut" }, 0)
          .to(overlay, { autoAlpha: 0, duration: 0.4, ease: "power1.in" }, 0.35);
      }
    }
  }, [isOpen, project]);

  // entrada em cascata do conteúdo, encaixada logo após o clip-path abrir
  useEffect(() => {
    if (!project) return;
    const inner = document.getElementById("projectdetail-inner")!;
    const pieces = inner.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduceMotionRef.current) {
      gsap.set(pieces, { opacity: 1, y: 0 });
      return;
    }
    gsap.set(pieces, { opacity: 0, y: 20 });
    gsap.to(pieces, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", delay: 0.35 });

    // microinteração dos botões (fechar, setas, ações): quickTo retarget em vez de
    // gsap.to() novo por evento — mesmo motivo do fix de hover da lista de projetos,
    // um scale por play/retarget não disputa a propriedade com ninguém.
    const buttons = inner.querySelectorAll<HTMLElement>(
      ".projectdetail__close, .projectdetail__carousel-arrow, .projectdetail__action",
    );
    const cleanups: Array<() => void> = [];
    buttons.forEach((el) => {
      const scale = gsap.quickTo(el, "scale", { duration: 0.3, ease: "power3.out" });
      const onEnter = () => scale(1.06);
      const onLeave = () => scale(1);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        gsap.killTweensOf(el);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [project]);

  // transição do slide do carrossel — translateX em px (não xPercent: o track
  // é mais largo que o viewport, xPercent seria relativo à própria largura dele)
  useEffect(() => {
    if (!project) return;
    const viewport = document.getElementById("projectdetail-carousel-viewport");
    const track = document.getElementById("projectdetail-carousel-track");
    if (!viewport || !track) return;
    const x = -slideIndex * viewport.clientWidth;
    if (reduceMotionRef.current) gsap.set(track, { x });
    else gsap.to(track, { x, duration: 0.6, ease: "power3.inOut" });
  }, [slideIndex, project]);

  const images = project?.images ?? [];

  return (
    <div className="projectdetail" id="projectdetail" aria-hidden={!isOpen}>
      {project && (
        <div className="projectdetail__inner" id="projectdetail-inner">
          <button
            type="button"
            className="projectdetail__close"
            onClick={handleClose}
            aria-label="Fechar projeto"
            data-reveal
          >
            <span aria-hidden="true">×</span> Fechar
          </button>

          <div className="projectdetail__body">
            <span className="projectdetail__eyebrow" data-reveal>
              Projeto
            </span>
            <h2 className="projectdetail__title" data-reveal>
              <AnimatedLetters text={project.title} prefix="projectdetail" />
            </h2>
            <p className="projectdetail__desc" data-reveal>
              {project.description}
            </p>
            <ul className="projectdetail__techs" data-reveal>
              {project.techs.map((t) => (
                <li className="projectdetail__tech" key={t}>
                  {t}
                </li>
              ))}
            </ul>

            <div className="projectdetail__carousel" data-reveal>
              <div className="projectdetail__carousel-viewport" id="projectdetail-carousel-viewport">
                <div className="projectdetail__carousel-track" id="projectdetail-carousel-track">
                  {images.map((src, i) => (
                    <img
                      key={src + i}
                      className="projectdetail__carousel-slide"
                      src={src}
                      alt={`${project.title} — imagem ${i + 1} de ${images.length}`}
                    />
                  ))}
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="projectdetail__carousel-arrow projectdetail__carousel-arrow--prev"
                    onClick={() => setSlideIndex((i) => (i - 1 + images.length) % images.length)}
                    aria-label="Imagem anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="projectdetail__carousel-arrow projectdetail__carousel-arrow--next"
                    onClick={() => setSlideIndex((i) => (i + 1) % images.length)}
                    aria-label="Próxima imagem"
                  >
                    ›
                  </button>
                  <div className="projectdetail__carousel-dots">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`projectdetail__carousel-dot${i === slideIndex ? " is-active" : ""}`}
                        onClick={() => setSlideIndex(i)}
                        aria-label={`Ir para imagem ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {project.actions.length > 0 && (
              <div className="projectdetail__actions" data-reveal>
                {project.actions.map((a) => (
                  <a key={a.label + a.link} className="projectdetail__action" href={a.link} target="_blank" rel="noreferrer">
                    {a.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
