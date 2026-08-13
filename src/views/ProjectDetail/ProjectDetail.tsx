import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { prefersReducedMotion } from "../../lib/motion";
import { lockSectionStack, unlockSectionStack } from "../../lib/sectionStack";
import { getProjectBySlug, type Project } from "../../lib/projects";
import { applyProjectMeta, getSlugFromLocation, popProjectUrl, pushProjectUrl } from "../../lib/router";
import AnimatedLetters from "../../components/AnimatedLetters";
import ProjectGallery from "../../components/ProjectGallery/ProjectGallery";
import { AccentRule, DashedLine } from "../../components/graphics";
import "./ProjectDetail.css";

const strokeIcon = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const GithubIcon = () => (
  <svg {...strokeIcon}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const FigmaIcon = () => (
  <svg {...strokeIcon}>
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
  </svg>
);

const ExternalIcon = () => (
  <svg {...strokeIcon}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
);

// o CTA se identifica pelo destino, não pelo rótulo do JSON: lá "Link" cobre
// tanto protótipo do Figma quanto deploy, e "Repo" repete o que o host já diz.
// Host novo cai no fallback com o ícone de link externo, sem tocar aqui.
const ACTION_KINDS = [
  { host: /(^|\.)github\.com$/, label: "Repositório", note: "código-fonte", Icon: GithubIcon },
  { host: /(^|\.)figma\.com$/, label: "Protótipo", note: "navegável no Figma", Icon: FigmaIcon },
];
const FALLBACK_KIND = { label: "Ver ao vivo", note: "aplicação publicada", Icon: ExternalIcon };

function actionMeta(link: string) {
  let host = "";
  try {
    host = new URL(link).hostname.replace(/^www\./, "");
  } catch {
    // link relativo ou malformado no JSON: sem host, cai no fallback
  }
  return { ...(ACTION_KINDS.find((k) => k.host.test(host)) ?? FALLBACK_KIND), host };
}

// nome no JSON → pacote no registro. Só o que existe no npm entra: Figma, SQL e
// afins viram chip sem tooltip, que é a verdade (não são pacote de nada).
const TECH_NPM: Record<string, string> = {
  Vue: "vue",
  Vite: "vite",
  Vuelidate: "@vuelidate/core",
  "shadcn/ui": "shadcn",
  React: "react",
  "React Native": "react-native",
  Expo: "expo",
  "styled-components": "styled-components",
  "Sequelize ORM": "sequelize",
  Bootstrap: "bootstrap",
};

type NpmInfo = { description?: string; version?: string };

// o texto do tooltip vem do próprio registro, não de uma descrição escrita à mão
// que envelheceria aqui dentro. Cache no módulo: o mesmo pacote aparece em vários
// projetos e o overlay remonta a cada abertura.
const npmCache = new Map<string, Promise<NpmInfo>>();
const fetchNpm = (pkg: string) => {
  if (!npmCache.has(pkg)) {
    npmCache.set(
      pkg,
      // /latest e não o packument inteiro: o de `react` passa de 1 MB
      fetch(`https://registry.npmjs.org/${pkg}/latest`)
        .then((r) => (r.ok ? (r.json() as Promise<NpmInfo>) : {}))
        .catch(() => ({})),
    );
  }
  return npmCache.get(pkg)!;
};

// overlay "página" de projeto: sempre montado (escuta project:open + a URL
// direta em /projetos/:slug), mas só ocupa a tela quando `project` existe.
// Abre/fecha com um clip-path circle() a partir do ponto clicado — é uma
// transição por cima do app, não uma navegação real, então nada por baixo
// (scroll da pilha, seções) é desmontado ou perdido.
export default function ProjectDetail() {
  const [project, setProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const originRef = useRef({ x: 0, y: 0 });
  const reduceMotionRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion();
    originRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const open = (slug: string, x?: number, y?: number) => {
      const p = getProjectBySlug(slug);
      // slug inexistente na URL: some com ela em vez de deixar a home respondendo
      // num endereço que não existe (soft-404 pro crawler, URL mentirosa pro usuário)
      if (!p) {
        if (getSlugFromLocation() === slug) history.replaceState({}, "", "/");
        return;
      }
      applyProjectMeta(p);
      if (x != null && y != null) originRef.current = { x, y };
      setProject(p);
      setIsOpen(true);
      lockSectionStack();
    };

    const initialSlug = getSlugFromLocation();
    if (initialSlug) open(initialSlug);

    const onOpenEvent = ((e: CustomEvent<{ slug: string; x: number; y: number; trigger?: HTMLElement }>) => {
      triggerRef.current = e.detail.trigger ?? null;
      pushProjectUrl(e.detail.slug);
      open(e.detail.slug, e.detail.x, e.detail.y);
    }) as EventListener;
    window.addEventListener("project:open", onOpenEvent);

    const onPopState = () => {
      const slug = getSlugFromLocation();
      if (slug) open(slug);
      else {
        applyProjectMeta(null);
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
    applyProjectMeta(null);
    setIsOpen(false);
    unlockSectionStack();
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeydown = (e: KeyboardEvent) => {
      // com o lightbox da galeria aberto, o Esc é dele (o <dialog> fecha sozinho, e
      // nesse instante ainda está [open]) — sem esse desvio um Esc fecharia os dois
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) handleClose();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen]);

  // clip-path circle() a partir do ponto de origem (clique na row, ou o centro
  // da tela numa carga direta da URL) — a única animação "de transição" daqui;
  // o conteúdo em si (título/descrição/techs/galeria) usa React normal.
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

    // foco vai pro botão fechar assim que a ficha monta — sem isso o teclado/leitor
    // de tela fica preso no que ficou por baixo do overlay (o clip-path é só visual).
    // Sem checar isOpen: `project` só vira não-nulo dentro de open(), que já liga o
    // isOpen no mesmo render, e no fechamento ele volta a null (return lá em cima) —
    // pôr isOpen nas deps só faria a cascata inteira reanimar durante o fecha.
    inner.querySelector<HTMLElement>(".projectdetail__close")?.focus();
    if (reduceMotionRef.current) {
      gsap.set(pieces, { opacity: 1, y: 0 });
      return;
    }
    gsap.set(pieces, { opacity: 0, y: 20 });
    gsap.to(pieces, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", delay: 0.35 });

    // microinteração dos alvos clicáveis: quickTo retarget em vez de gsap.to() novo
    // por evento — mesmo motivo do fix de hover da lista de projetos, um scale por
    // play/retarget não disputa a propriedade com ninguém. O gancho é [data-lift],
    // então botão novo entra na microinteração sem tocar neste seletor.
    const cleanups: Array<() => void> = [];
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent-lime").trim();
    inner.querySelectorAll<HTMLElement>("[data-lift]").forEach((el) => {
      const y = gsap.quickTo(el, "y", { duration: 0.3, ease: "power3.out" });
      // ícone e seta acendem junto com o lift; o :hover do CSS continua como estado
      // final (e é o que sobra sob reduced-motion, que nem chega neste loop)
      const tint = el.querySelectorAll<HTMLElement>(
        ".projectdetail__action-icon, .projectdetail__action-arrow"
      );
      const fade = (color: string) => {
        if (tint.length) gsap.to(tint, { color, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      };
      const onEnter = () => {
        y(-3);
        fade(accent);
      };
      const onLeave = () => {
        y(0);
        fade("rgba(244, 247, 245, 0.4)");
      };
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        gsap.killTweensOf(el);
        gsap.killTweensOf(tint);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [project]);

  // scroll do overlay no mesmo idiom da pilha (ver sectionStack): o wheel vira alvo
  // acumulado e o quickTo faz o glide por retarget, em vez do passo seco do scroll
  // nativo — era a única tela do site que rolava fora desse padrão. O container
  // continua overflow:auto de verdade (o tween só escreve scrollTop), então barra
  // de rolagem e scroll por foco de teclado seguem funcionando.
  useEffect(() => {
    if (!project || reduceMotionRef.current) return;
    const overlay = document.getElementById("projectdetail")!;
    const pos = { y: overlay.scrollTop };
    let target = pos.y;
    const scrollTo = gsap.quickTo(pos, "y", {
      duration: 0.7,
      ease: "power3",
      onUpdate: () => {
        overlay.scrollTop = pos.y;
      },
    });
    const observer = Observer.create({
      target: overlay,
      type: "wheel,touch",
      preventDefault: true,
      // o lightbox está na top layer mas continua descendente daqui na árvore:
      // sem ignorá-lo, o wheel do zoom rolaria a ficha por baixo
      ignore: document.getElementById("gallery-lightbox") ?? undefined,
      onChange: (self) => {
        const room = overlay.scrollHeight - overlay.clientHeight;
        target = gsap.utils.clamp(0, room, target + self.deltaY);
        scrollTo(target);
      },
    });

    // scroll que não veio do wheel (Tab levando o foco pra fora da dobra, arrastar a
    // barra) move o scrollTop por fora do tween — sem ressincronizar, o notch seguinte
    // saltaria de volta pro último alvo acumulado
    const onScroll = () => {
      if (!gsap.isTweening(pos)) target = overlay.scrollTop;
    };
    overlay.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.kill();
      gsap.killTweensOf(pos);
      overlay.removeEventListener("scroll", onScroll);
    };
  }, [project]);

  // tooltip do npm: um elemento só, reposicionado por chip (não um por tech).
  // x/y saem do rect do chip e autoAlpha/scale de uma timeline pausada — canais
  // separados, sem dois donos da mesma prop.
  useEffect(() => {
    if (!project) return;
    const inner = document.getElementById("projectdetail-inner")!;
    const chips = inner.querySelectorAll<HTMLElement>("[data-npm]");
    if (!chips.length) return;
    // guardado agora, e não lido no cleanup: ao fechar a ficha o React já tirou o
    // inner do DOM antes do efeito limpar, e ali parentElement é null
    const scroller = inner.parentElement!;

    const tip = document.getElementById("projectdetail-tip")!;
    const head = tip.querySelector<HTMLElement>(".projectdetail__tip-head")!;
    const body = tip.querySelector<HTMLElement>(".projectdetail__tip-body")!;
    gsap.set(tip, { autoAlpha: 0, scale: 0.94, xPercent: -50, yPercent: -100 });

    const show = gsap.timeline({ paused: true }).to(tip, {
      autoAlpha: 1,
      scale: 1,
      duration: reduceMotionRef.current ? 0 : 0.26,
      ease: "power3.out",
    });

    // qual chip está sob o mouse agora: a resposta do registro é assíncrona e pode
    // chegar depois de o ponteiro já ter ido pro chip seguinte
    let hovered = "";
    const cleanups: Array<() => void> = [];

    chips.forEach((el) => {
      const pkg = el.dataset.npm!;
      const onEnter = () => {
        hovered = pkg;
        const r = el.getBoundingClientRect();
        gsap.set(tip, { x: r.left + r.width / 2, y: r.top - 10 });
        head.textContent = `npm i ${pkg}`;
        body.textContent = "consultando o registro…";
        show.play();
        fetchNpm(pkg).then((info) => {
          if (hovered !== pkg) return;
          head.textContent = `npm i ${pkg}${info.version ? `  ·  v${info.version}` : ""}`;
          body.textContent = info.description ?? "pacote fora do ar no registro.";
        });
      };
      const onLeave = () => {
        hovered = "";
        show.reverse();
      };
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      // teclado chega no chip por foco, não por mouseenter — sem estes dois o
      // tooltip só existiria pra quem usa ponteiro
      el.addEventListener("focus", onEnter);
      el.addEventListener("blur", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("focus", onEnter);
        el.removeEventListener("blur", onLeave);
      });
    });

    // o tooltip é fixed e a posição vem do rect do chip: rolar com ele aberto o
    // deixaria à deriva. ponytail: esconde em vez de reposicionar por frame.
    const onScroll = () => {
      if (!hovered) return;
      hovered = "";
      show.reverse();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cleanups.forEach((fn) => fn());
      scroller.removeEventListener("scroll", onScroll);
      show.kill();
    };
  }, [project]);

  return (
    <div className="projectdetail" id="projectdetail" aria-hidden={!isOpen}>
      {project && (
        <div className="projectdetail__inner" id="projectdetail-inner">
          <button
            type="button"
            className="projectdetail__close"
            onClick={handleClose}
            aria-label="Fechar projeto"
            data-lift
            data-reveal
          >
            <span className="projectdetail__close-glyph" aria-hidden="true">
              ×
            </span>
            Fechar
          </button>

          <header className="projectdetail__head">
            <span className="projectdetail__eyebrow" data-reveal>
              Projeto
            </span>

            <h2 className="projectdetail__title" data-reveal>
              <AnimatedLetters text={project.title} prefix="projectdetail" />
            </h2>

            <div className="projectdetail__rule-wrap" data-reveal>
              <AccentRule className="projectdetail__rule" length="min(220px, 34vw)" />
            </div>

            <div className="projectdetail__lead">
              <p className="projectdetail__desc" data-reveal>
                {project.description}
              </p>

              {project.actions.length > 0 && (
                <div className="projectdetail__actions" data-reveal>
                  {project.actions.map((a) => {
                    const { label, note, host, Icon } = actionMeta(a.link);
                    return (
                      <a
                        key={a.link}
                        className="projectdetail__action"
                        href={a.link}
                        target="_blank"
                        rel="noreferrer"
                        data-lift
                      >
                        <span className="projectdetail__action-icon" aria-hidden="true">
                          <Icon />
                        </span>
                        <span className="projectdetail__action-text">
                          <span className="projectdetail__action-label">{label}</span>
                          <span className="projectdetail__action-note">{host || note}</span>
                        </span>
                        <span className="projectdetail__action-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </header>

          <DashedLine className="projectdetail__hr" />

          {/* key: trocar de projeto sem desmontar a ficha (URL direta, popstate)
             precisa zerar índice e ampliação da galeria */}
          <ProjectGallery key={project.slug} images={project.images} title={project.title} />

          <section className="projectdetail__techs-block" data-reveal>
            <h3 className="projectdetail__block-title">Tecnologias utilizadas</h3>
            <ul className="projectdetail__techs">
              {project.techs.map((t) => {
                const pkg = TECH_NPM[t];
                return (
                  <li key={t}>
                    {pkg ? (
                      <a
                        className="projectdetail__tech projectdetail__tech--npm"
                        href={`https://www.npmjs.com/package/${pkg}`}
                        target="_blank"
                        rel="noreferrer"
                        data-npm={pkg}
                        aria-describedby="projectdetail-tip"
                      >
                        {t}
                        <span className="projectdetail__tech-mark" aria-hidden="true">
                          npm
                        </span>
                      </a>
                    ) : (
                      <span className="projectdetail__tech">{t}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <div
            className="projectdetail__tip"
            id="projectdetail-tip"
            role="tooltip"
            aria-live="polite"
          >
            <span className="projectdetail__tip-head"></span>
            <p className="projectdetail__tip-body"></p>
            <DashedLine className="projectdetail__tip-edge" accent />
          </div>

        </div>
      )}
    </div>
  );
}
