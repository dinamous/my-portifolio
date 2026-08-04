import { useEffect } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { prefersReducedMotion } from "../../lib/motion";
import { scrubTimeline } from "../../lib/scrub";
import "./Skills.css";

gsap.registerPlugin(ScrambleTextPlugin);

// ponytail: stack hardcoded, mesmo motivo do `about` na AboutMe — vira documento
// do Sanity quando o schema existir; só este array alimenta a coluna direita.
const categories = [
  { name: "Linguagens", techs: ["TypeScript", "JavaScript", "HTML", "CSS", "SQL", "Python"] },
  { name: "Frameworks", techs: ["React", "Next.js", "Astro", "Vite", "React Router", "TanStack Query"] },
  { name: "Interface & Estilo", techs: ["Tailwind CSS", "Sass", "CSS Modules", "Radix UI", "shadcn/ui", "Storybook"] },
  { name: "Animação", techs: ["GSAP", "ScrollTrigger", "Observer", "SplitText", "Lenis", "Lottie"] },
  { name: "3D & Shaders", techs: ["Three.js", "React Three Fiber", "WebGL", "GLSL", "Blender", "Spline"] },
  { name: "Backend & APIs", techs: ["Node.js", "Express", "Fastify", "REST", "GraphQL", "WebSockets"] },
  { name: "Dados & CMS", techs: ["PostgreSQL", "MongoDB", "Supabase", "Prisma", "Sanity", "Redis"] },
  { name: "Infra & Deploy", techs: ["Git", "GitHub Actions", "Docker", "Vercel", "Cloudflare", "Nginx"] },
  { name: "Qualidade & Design", techs: ["Vitest", "Playwright", "ESLint", "Prettier", "Figma", "Lighthouse"] },
];

const headlineLines = [
  "Estas são as",
  "ferramentas com que",
  "trabalho todo dia.",
];

const meta = [
  { term: "Formação", value: "Bacharel em Ciência da Computação" },
  { term: "Atuação", value: "Desenvolvedor com foco em Front-end" },
];

export default function Skills() {
  useEffect(() => {
    const section = document.getElementById("skills-section")!;
    const rule = document.getElementById("skills-rule")!;
    const lines = Array.from(section.querySelectorAll<HTMLElement>(".skills__line-inner"));
    const metaRows = Array.from(section.querySelectorAll<HTMLElement>(".skills__meta-row"));
    const cats = Array.from(section.querySelectorAll<HTMLElement>(".skills__cat"));
    const names = Array.from(section.querySelectorAll<HTMLElement>(".skills__cat-name"));

    const reduceMotion = prefersReducedMotion();
    const cleanups: Array<() => void> = [];

    // cada categoria só precisa dos próprios nós; resolvidos uma vez aqui pra
    // não reconsultar o DOM a cada toggle
    const panels = cats.map((cat) => ({
      cat,
      body: cat.querySelector<HTMLElement>(".skills__cat-body")!,
      head: cat.querySelector<HTMLButtonElement>(".skills__cat-head")!,
      icon: cat.querySelector<HTMLElement>(".skills__cat-icon")!,
      techs: Array.from(cat.querySelectorAll<HTMLElement>(".skills__tech")),
    }));

    gsap.set(panels.map((p) => p.body), { height: 0, overflow: "hidden" });
    gsap.set(panels.flatMap((p) => p.techs), { opacity: 0, y: -8 });

    // acordeão de abertura única: abrir um fecha o anterior, clicar no aberto fecha tudo
    let openIndex = -1;
    const setOpen = (index: number, instant = false) => {
      const dur = instant || reduceMotion ? 0 : 0.5;
      panels.forEach((p, i) => {
        const open = i === index;
        p.head.setAttribute("aria-expanded", String(open));
        p.cat.classList.toggle("skills__cat--open", open);
        gsap.to(p.body, { height: open ? "auto" : 0, duration: dur, ease: "power3.inOut", overwrite: true });
        gsap.to(p.icon, { rotate: open ? 45 : 0, duration: dur, ease: "power3.inOut", overwrite: true });
        gsap.to(p.techs, {
          opacity: open ? 1 : 0,
          y: open ? 0 : -8,
          duration: dur * 0.7,
          stagger: open ? 0.03 : 0,
          ease: "power2.out",
          overwrite: true,
        });
      });
      openIndex = index;
    };
    setOpen(0, true);

    panels.forEach((p, i) => {
      const onClick = () => setOpen(openIndex === i ? -1 : i);
      p.head.addEventListener("click", onClick);
      cleanups.push(() => p.head.removeEventListener("click", onClick));
    });

    if (reduceMotion) {
      gsap.set([rule, ...lines, ...metaRows, ...cats], { opacity: 1, y: 0, yPercent: 0 });
    } else {
      gsap.set(rule, { opacity: 0, scaleX: 0 });
      gsap.set(lines, { yPercent: 110 });
      gsap.set(metaRows, { opacity: 0, y: 14 });
      gsap.set(cats, { opacity: 0, y: 24 });

      const reveal = gsap
        .timeline({ paused: true })
        .to(lines, { yPercent: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" }, 0)
        .to(cats, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out" }, 0.2)
        .to(rule, { opacity: 1, scaleX: 1, duration: 0.5, ease: "power3.inOut" }, 0.35)
        .to(metaRows, { opacity: 1, y: 0, duration: 0.45, stagger: 0.09, ease: "power2.out" }, 0.45);

      const setProgress = scrubTimeline(reveal);
      const onProjectsProgress = ((e: CustomEvent<{ progress: number }>) => {
        setProgress(e.detail.progress);
      }) as EventListener;
      window.addEventListener("projects:progress", onProjectsProgress);
      cleanups.push(() => window.removeEventListener("projects:progress", onProjectsProgress));

      // microinteração: scramble no nome da categoria ao passar o mouse
      names.forEach((name) => {
        const onEnter = () =>
          gsap.to(name, {
            duration: 0.5,
            scrambleText: { text: name.dataset.text ?? "", chars: "upperAndLowerCase", speed: 0.5 },
            ease: "none",
          });
        name.addEventListener("mouseenter", onEnter);
        cleanups.push(() => name.removeEventListener("mouseenter", onEnter));
      });
    }

    // saída própria da Skills: dissolve em glitch — os textos viram símbolo por um
    // instante (reaproveitando o ScrambleTextPlugin já carregado aqui) antes do
    // fade, identidade "digital" distinta do fade da AboutMe e da cascata da
    // Projects. Disparado uma única vez (guard), não a cada tick de progresso.
    // data-no-close-clip tira essa seção do fechamento genérico do sectionStack.
    let glitchTriggered = false;
    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;

      if (!reduceMotion && !glitchTriggered && p > 0.12) {
        glitchTriggered = true;
        [...names, ...(panels[openIndex]?.techs ?? [])].forEach((el) => {
          gsap.to(el, {
            duration: 0.5,
            scrambleText: { text: el.textContent ?? "", chars: "!<>-_\\/[]{}—=+*^?#", speed: 0.35, revealDelay: 0 },
            ease: "none",
          });
        });
      }

      const fadeT = reduceMotion ? p : gsap.utils.clamp(0, 1, (p - 0.15) / 0.5);
      gsap.set([...cats, rule, ...metaRows, ...lines.map((l) => l.parentElement!)], { opacity: 1 - fadeT });
      // mesmo motivo do fade de fundo na Projects, mas começando mais cedo
      // (0.45, logo após o conteúdo dissolver): o reveal da Contact é escrubado
      // na segunda metade da faixa, e com o fundo sumindo só em 0.75+ a entrada
      // dela acontecia inteira atrás do fundo opaco — dessincronizado.
      const bgFadeT = gsap.utils.clamp(0, 1, (p - 0.45) / 0.3);
      gsap.set(section, { opacity: 1 - bgFadeT, display: p >= 1 ? "none" : "" });

      window.dispatchEvent(new CustomEvent("skills:progress", { detail: { progress: p } }));
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      cleanups.forEach((fn) => fn());
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section className="skills fixed inset-0 h-screen w-screen" id="skills-section" data-stack data-no-close-clip>
      <div className="skills__intro">
        <h2 className="skills__headline">
          {headlineLines.map((line) => (
            <span className="skills__line" key={line}>
              <span className="skills__line-inner">{line}</span>
            </span>
          ))}
        </h2>

        <span className="skills__rule" id="skills-rule" aria-hidden="true"></span>

        <dl className="skills__meta">
          {meta.map((item) => (
            <div className="skills__meta-row" key={item.term}>
              <dt className="skills__meta-term">{item.term}</dt>
              <dd className="skills__meta-value">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* data-stack-scroll: o Observer do sectionStack captura o wheel na janela
         inteira, então essa coluna só rola porque ele repassa o delta pra cá */}
      <div className="skills__list" id="skills-list" data-stack-scroll>
        {categories.map((cat, i) => (
          <div className="skills__cat" key={cat.name}>
            <button
              className="skills__cat-head"
              type="button"
              aria-expanded="false"
              aria-controls={`skills-cat-body-${i}`}
            >
              <span className="skills__cat-name" data-text={cat.name}>{cat.name}</span>
              <span className="skills__cat-icon" aria-hidden="true">+</span>
            </button>
            <div className="skills__cat-body" id={`skills-cat-body-${i}`}>
              <ul className="skills__techs">
                {cat.techs.map((tech) => (
                  <li className="skills__tech" key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
