import { useEffect } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import Parallax from "parallax-js";
import "./Skills.css";

gsap.registerPlugin(ScrambleTextPlugin);

// ponytail: categorias/tags placeholder, ajustar conforme stack real evoluir
const categories = [
  { name: "Frontend", tags: ["Astro", "Tailwind CSS", "TypeScript", "Vite"] },
  { name: "Animação & 3D", tags: ["GSAP", "Three.js", "WebGL", "Blender"] },
  { name: "Ferramentas", tags: ["Figma", "Git", "Sanity", "Vercel"] },
  { name: "Performance", tags: ["Lighthouse", "Core Web Vitals", "Lazy Loading", "A11y"] },
];

export default function Skills() {
  useEffect(() => {
    const section = document.getElementById("skills-section")!;
    const grid = document.getElementById("skills-grid")!;
    const label = document.getElementById("skills-label")!;
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".skills__panel"));
    const headings = Array.from(document.querySelectorAll<HTMLElement>(".skills__heading"));
    const tags = Array.from(document.querySelectorAll<HTMLElement>(".skills__tag"));

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let onProjectsProgress: EventListener | undefined;
    let parallaxInstance: InstanceType<typeof Parallax> | undefined;
    const tagCleanups: Array<() => void> = [];

    if (reduceMotion) {
      gsap.set([grid, label, ...panels], { opacity: 1 });
      gsap.set(tags, { opacity: 1, y: 0 });
    } else {
      gsap.set(grid, { opacity: 0, scale: 1.08 });
      gsap.set(label, { opacity: 0 });
      gsap.set(panels, { opacity: 0, y: 30 });
      gsap.set(tags, { opacity: 0, y: 14 });

      // scramble-in disparado uma unica vez por titulo, guardado num WeakSet
      // pra nao repetir a cada tick de progresso escrubado
      const scrambled = new WeakSet<HTMLElement>();
      const scrambleIn = (el: HTMLElement) => {
        if (scrambled.has(el)) return;
        scrambled.add(el);
        gsap.to(el, {
          duration: 0.8,
          scrambleText: { text: el.dataset.text ?? el.textContent ?? "", chars: "upperAndLowerCase", speed: 0.4 },
          ease: "none",
        });
      };

      const reveal = gsap
        .timeline({ paused: true })
        .to(grid, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }, 0)
        .to(label, { opacity: 1, duration: 0.4 }, 0.1);

      panels.forEach((panel, i) => {
        const panelTags = panel.querySelectorAll(".skills__tag");
        reveal
          .to(panel, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.15 + i * 0.1)
          .call(() => scrambleIn(headings[i]), [], 0.15 + i * 0.1)
          .to(panelTags, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }, 0.25 + i * 0.1);
      });

      const revealProgress = { value: 0 };
      const setProgress = gsap.quickTo(revealProgress, "value", {
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => reveal.progress(revealProgress.value),
      });

      onProjectsProgress = ((e: CustomEvent<{ progress: number }>) => {
        setProgress(e.detail.progress);
      }) as EventListener;
      window.addEventListener("projects:progress", onProjectsProgress);

      // microinteracao: glitch/scramble ao passar o mouse sobre cada tag
      tags.forEach((tag) => {
        const onMouseenter = () => {
          gsap.to(tag, {
            duration: 0.5,
            scrambleText: { text: tag.dataset.text ?? tag.textContent ?? "", chars: "upperAndLowerCase", speed: 0.5 },
            borderColor: "rgba(52, 211, 153, 0.7)",
            ease: "none",
          });
        };
        const onMouseleave = () => {
          gsap.to(tag, { borderColor: "rgba(244, 247, 245, 0.25)", duration: 0.4 });
        };
        tag.addEventListener("mouseenter", onMouseenter);
        tag.addEventListener("mouseleave", onMouseleave);
        tagCleanups.push(() => {
          tag.removeEventListener("mouseenter", onMouseenter);
          tag.removeEventListener("mouseleave", onMouseleave);
        });
      });

      parallaxInstance = new Parallax(section, { relativeInput: true, hoverOnly: true, selector: "[data-depth]" });
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
        [...headings, ...tags].forEach((el) => {
          gsap.to(el, {
            duration: 0.5,
            scrambleText: { text: el.textContent ?? "", chars: "!<>-_\\/[]{}—=+*^?#", speed: 0.35, revealDelay: 0 },
            ease: "none",
          });
        });
      }

      const fadeT = reduceMotion ? p : gsap.utils.clamp(0, 1, (p - 0.15) / 0.5);
      gsap.set(panels, { opacity: 1 - fadeT });
      gsap.set([grid, label], { opacity: 1 - fadeT });
      // mesmo motivo do fade de fundo na Projects: sem isso o fundo sólido da
      // seção esconderia a Contact até o corte seco do display:none.
      const bgFadeT = gsap.utils.clamp(0, 1, (p - 0.75) / 0.25);
      gsap.set(section, { opacity: 1 - bgFadeT, display: p >= 1 ? "none" : "" });

      window.dispatchEvent(new CustomEvent("skills:progress", { detail: { progress: p } }));
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      if (onProjectsProgress) window.removeEventListener("projects:progress", onProjectsProgress);
      tagCleanups.forEach((fn) => fn());
      parallaxInstance?.destroy();
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section className="skills fixed inset-0 h-screen w-screen" id="skills-section" data-stack data-no-close-clip>
      <div className="skills__grid" id="skills-grid" data-depth="0.15" aria-hidden="true"></div>
      <div className="skills__label" id="skills-label">&lt;Skills <span className="skills__label-slash">/</span>&gt;</div>
      <div className="skills__panels" id="skills-panels">
        {categories.map((cat, i) => (
          <div className="skills__panel" id={`skills-panel-${i}`} key={cat.name}>
            <h3 className="skills__heading" data-text={cat.name}>{cat.name}</h3>
            <div className="skills__tags">
              {cat.tags.map((tag) => (
                <span className="skills__tag" data-text={tag} key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
