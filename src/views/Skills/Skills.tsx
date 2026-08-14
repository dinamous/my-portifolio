import { useEffect } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { prefersReducedMotion } from "../../lib/motion";
import { scrubValue } from "../../lib/scrub";
import { AccentRule } from "../../components/graphics";
import "./Skills.css";

// ponytail: esta view não usa mais scrambleText, mas o registro único do plugin
// mora aqui e o easter egg da Hero depende dele — não remover junto com o hover.
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

    const reduceMotion = prefersReducedMotion();
    const cleanups: Array<() => void> = [];

    // cada categoria só precisa dos próprios nós; resolvidos uma vez aqui pra
    // não reconsultar o DOM a cada toggle
    const panels = cats.map((cat) => ({
      cat,
      body: cat.querySelector<HTMLElement>(".skills__cat-body")!,
      head: cat.querySelector<HTMLButtonElement>(".skills__cat-head")!,
      icon: cat.querySelector<HTMLElement>(".skills__cat-icon")!,
      name: cat.querySelector<HTMLElement>(".skills__cat-name")!,
      underline: cat.querySelector<HTMLElement>(".skills__cat-underline")!,
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

      if (reduceMotion) return;
      // mesmo idiom das rows da Projects: pull magnético via quickTo (retarget contínuo
      // no mousemove) + uma timeline pausada tocada em play/reverse — um gsap.to por
      // evento fica preso no valor do primeiro quando o mouse cruza rápido entre linhas.
      // o ícone fica de fora: os tweens do acordeão usam overwrite e matariam o hover.
      const moveX = gsap.quickTo(p.head, "x", { duration: 0.8, ease: "power2" });
      const hover = gsap
        .timeline({ paused: true })
        // power1.inOut e não power3.out: a linha entra e sai no mesmo ritmo, sem o
        // arranque seco do out — é uma faixa de 1px, não precisa chamar atenção
        .to(p.underline, { scaleX: 1, duration: 0.75, ease: "power1.inOut" }, 0)
        .to(p.name, { x: 5, duration: 0.7, ease: "power2.out" }, 0);

      const onMousemove = (e: MouseEvent) => {
        const rect = p.head.getBoundingClientRect();
        moveX(((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 5);
      };
      const onMouseenter = () => hover.play();
      const onMouseleave = () => {
        moveX(0);
        hover.reverse();
      };
      p.head.addEventListener("mousemove", onMousemove);
      p.head.addEventListener("mouseenter", onMouseenter);
      p.head.addEventListener("mouseleave", onMouseleave);
      cleanups.push(() => {
        p.head.removeEventListener("mousemove", onMousemove);
        p.head.removeEventListener("mouseenter", onMouseenter);
        p.head.removeEventListener("mouseleave", onMouseleave);
        hover.kill();
      });
    });

    // indicador de scroll: só existe quando a coluna transborda (varia por viewport) e
    // só é visível junto com as categorias — senão apareceria inteiro por cima do wipe
    // de entrada. Por isso as duas fontes ficam separadas e o paint multiplica as duas.
    const list = document.getElementById("skills-list")!;
    const bar = document.getElementById("skills-scrollbar")!;
    const thumb = bar.querySelector<HTMLElement>(".skills__scrollbar-thumb")!;
    let roomAlpha = 0;
    let revealAlpha = 0;
    const paintBar = () => gsap.set(bar, { opacity: roomAlpha * revealAlpha });

    const syncBar = () => {
      roomAlpha = list.scrollHeight - list.clientHeight > 1 ? 1 : 0;
      gsap.set(thumb, {
        scaleY: list.clientHeight / list.scrollHeight,
        y: (list.scrollTop / list.scrollHeight) * list.clientHeight,
      });
      paintBar();
    };
    list.addEventListener("scroll", syncBar, { passive: true });
    // o acordeão tweena a altura das categorias — um ResizeObserver nelas cobre isso,
    // resize de janela e carga de fonte com um listener só (e dispara uma vez no observe)
    const ro = new ResizeObserver(syncBar);
    cats.forEach((c) => ro.observe(c));
    cleanups.push(() => {
      list.removeEventListener("scroll", syncBar);
      ro.disconnect();
    });

    // mesmo idiom da AboutMe: entrada e saída da seção não têm timeline nem tween —
    // cada elemento ganha a sua fatia de um único valor contínuo de progresso e é
    // escrito com gsap.set. Por isso também não há branch de reduced-motion aqui
    // (nada anima sozinho; tudo segue o scroll).
    // SPREAD é a fatia da janela gasta escalonando os starts; o resto (1 - SPREAD) é a
    // duração de cada elemento, então eles se sobrepõem. Sem isso cada um teria só
    // 1/count do trecho — com 9 categorias vira um piscar em vez de uma cascata.
    const SPREAD = 0.55;
    const seqT = (segT: number, index: number, count: number) => {
      const start = count > 1 ? (index / (count - 1)) * SPREAD : 0;
      return gsap.utils.clamp(0, 1, (segT - start) / (1 - SPREAD));
    };

    const stagger = (els: HTMLElement[], t: number, fn: (el: HTMLElement, k: number) => void) =>
      els.forEach((el, i) => fn(el, seqT(t, i, els.length)));

    const enterEase = gsap.parseEase("power3.out");

    // cada categoria é revelada por uma cortina que corre da esquerda pra direita (leva a
    // borda inferior junto, então a linha se desenha). Na saída a cortina continua no mesmo
    // sentido, saindo pela direita — entra e sai atravessando.

    gsap.set(lines, { yPercent: 110 });
    gsap.set(rule, { opacity: 0, scaleX: 0 });
    gsap.set(metaRows, { opacity: 0, y: 14 });
    gsap.set(cats, { opacity: 0, clipPath: "inset(0 100% 0 0)" });

    // guarda o progresso da Projects pro handler de saída distinguir "ainda não entrou"
    // (t < 1, p também lê 0) de "entrou e está parada" (t === 1, p também lê 0).
    let enteredT = 0;
    // entrada e saída mexem nos mesmos elementos e o stack dispara os dois no mesmo
    // tick, então sem esse flag as duas escreviam as mesmas props no mesmo frame.
    let exiting = false;

    // ENTER_START alinhado ao ponto em que a Projects começa a dissolver o próprio
    // fundo opaco: antes disso qualquer coisa animada aqui acontece atrás do preto —
    // era por isso que a seção "chegava montada", sem entrada visível.
    const ENTER_START = 0.38;

    const applyReveal = (t: number) => {
      if (exiting) return; // a saída já é dona desses elementos

      const revealT = gsap.utils.clamp(0, 1, (t - ENTER_START) / (1 - ENTER_START));

      // a manchete sobe linha a linha; a coluna de categorias começa logo em seguida e
      // corre em paralelo, então as duas colunas se constroem juntas em vez de uma
      // esperar a outra terminar
      stagger(lines, gsap.utils.clamp(0, 1, revealT / 0.5), (el, k) =>
        gsap.set(el, { yPercent: gsap.utils.interpolate(110, 0, enterEase(k)) }),
      );

      stagger(cats, gsap.utils.clamp(0, 1, (revealT - 0.12) / 0.88), (el, k) => {
        const e = enterEase(k);
        gsap.set(el, {
          opacity: gsap.utils.clamp(0, 1, e / 0.2),
          clipPath: `inset(0 ${(1 - e) * 100}% 0 0)`,
        });
      });

      // entra depois da cascata de categorias: ele mede uma coluna que ainda está sendo desenhada
      revealAlpha = gsap.utils.clamp(0, 1, (revealT - 0.6) / 0.25);
      paintBar();

      const ruleT = enterEase(gsap.utils.clamp(0, 1, (revealT - 0.42) / 0.28));
      gsap.set(rule, { opacity: ruleT, scaleX: ruleT });

      stagger(metaRows, gsap.utils.clamp(0, 1, (revealT - 0.55) / 0.45), (el, k) => {
        const e = enterEase(k);
        gsap.set(el, { opacity: e, y: gsap.utils.interpolate(14, 0, e) });
      });
    };

    // escrubado com lag (mesmo scrub da Contact): sem isso a cascata acompanha o notch do
    // wheel 1:1 e chega seca. `enteredT` fica fora do scrub — é o guard da saída e precisa
    // do valor cru, não do atrasado.
    const setReveal = reduceMotion ? applyReveal : scrubValue(applyReveal);
    const onProjectsProgress = ((e: CustomEvent<{ progress: number }>) => {
      enteredT = e.detail.progress;
      setReveal(enteredT);
    }) as EventListener;
    window.addEventListener("projects:progress", onProjectsProgress);
    cleanups.push(() => window.removeEventListener("projects:progress", onProjectsProgress));

    // saída própria: EXIT_HOLD segura tudo visível antes de qualquer coisa sair, depois
    // cada elemento sai pelo inverso da própria entrada, na sua janela de `et` — não um
    // fade único. Tudo termina em EXIT_END; só então o fundo sólido dissolve revelando a
    // Contact. data-no-close-clip tira esta seção do fechamento genérico do sectionStack.
    // HOLD curto porque o sectionStack já aplica o dele (HOLD = 0.25) antes de `local`
    // começar a andar — este é só a margem extra antes do primeiro elemento sair.
    const EXIT_HOLD = 0.05;
    const EXIT_END = 0.58;
    const exitEase = gsap.parseEase("power2.inOut");
    const exitLocalT = (start: number, span: number, et: number) =>
      exitEase(gsap.utils.clamp(0, 1, (et - start) / span));

    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;

      // p sozinho lê 0 tanto antes da Projects entregar quanto logo após entrar — sem
      // esse guard, et força tudo de volta ao estado final a cada tick, ainda na Projects.
      if (enteredT >= 1) {
        const et = gsap.utils.clamp(0, 1, (p - EXIT_HOLD) / (EXIT_END - EXIT_HOLD));

        // ordem inversa da entrada: a coluna de categorias sai primeiro, a manchete por último.
        // as janelas terminam em et = 1 pra saída ocupar toda a faixa até EXIT_END;
        // encurtá-las deixava um vão parado antes do fundo dissolver
        stagger(cats, exitLocalT(0, 0.62, et), (el, k) =>
          // a cortina sai pelo mesmo lado por onde entrou: entra e sai atravessando,
          // em vez de voltar por onde veio
          gsap.set(el, {
            opacity: 1 - gsap.utils.clamp(0, 1, (k - 0.8) / 0.2),
            clipPath: `inset(0 0 0 ${k * 100}%)`,
          }),
        );
        // sai com a coluna que ele mede, não depois dela
        revealAlpha = 1 - exitLocalT(0, 0.62, et);
        paintBar();

        stagger(metaRows, exitLocalT(0.2, 0.45, et), (el, k) =>
          gsap.set(el, { opacity: 1 - k, y: gsap.utils.interpolate(0, -14, k) }),
        );
        const ruleT = exitLocalT(0.3, 0.4, et);
        gsap.set(rule, { opacity: 1 - ruleT, scaleX: 1 - ruleT });
        stagger(lines, exitLocalT(0.35, 0.65, et), (el, k) =>
          gsap.set(el, { yPercent: gsap.utils.interpolate(0, -110, k) }),
        );
      }

      // visibility, não display: p vem do quickTo do sectionStack, que assenta/ultrapassa
      // em volta de 1 — flip de display nessa borda pisca. A opacity já é 0 antes disso.
      // o fade vai até p = 1 (mesmo idiom da AboutMe): terminar antes deixava a seção
      // sumir no meio do curso, com a barra de "Skills" na navbar ainda enchendo depois
      const fadeT = gsap.utils.clamp(0, 1, (p - EXIT_END) / (1 - EXIT_END));
      gsap.set(section, { opacity: 1 - fadeT, visibility: fadeT >= 1 ? "hidden" : "visible" });

      exiting = p > 0;
      window.dispatchEvent(new CustomEvent("skills:progress", { detail: { progress: p } }));
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    return () => {
      cleanups.forEach((fn) => fn());
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <section className="skills fixed inset-0 h-dvh w-screen" id="skills-section" data-stack data-no-close-clip>
      <div className="skills__intro">
        <h2 className="skills__headline">
          {headlineLines.map((line) => (
            <span className="skills__line" key={line}>
              <span className="skills__line-inner">{line}</span>
            </span>
          ))}
        </h2>

        <AccentRule id="skills-rule" className="skills__rule" />

        <dl className="skills__meta">
          {meta.map((item) => (
            <div className="skills__meta-row" key={item.term}>
              <dt className="skills__meta-term">{item.term}</dt>
              <dd className="skills__meta-value">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="skills__list-wrap">
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
                <span className="skills__cat-name">{cat.name}</span>
                <span className="skills__cat-icon" aria-hidden="true">+</span>
                <span className="skills__cat-underline" aria-hidden="true"></span>
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

        {/* trilho fora da lista: ela esconde a scrollbar nativa e o mask do topo/base
           comeria um indicador desenhado dentro dela */}
        <div className="skills__scrollbar" id="skills-scrollbar" aria-hidden="true">
          <span className="skills__scrollbar-thumb"></span>
        </div>
      </div>
    </section>
  );
}
