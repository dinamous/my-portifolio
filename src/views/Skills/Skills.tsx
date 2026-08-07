import { useEffect } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { prefersReducedMotion } from "../../lib/motion";
import { AccentRule } from "../../components/graphics";
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

    // mesmo idiom da AboutMe: entrada e saída da seção não têm timeline nem tween —
    // cada elemento ganha a sua fatia de um único valor contínuo de progresso e é
    // escrito com gsap.set. Por isso também não há branch de reduced-motion aqui
    // (nada anima sozinho; tudo segue o scroll), só no scramble mais abaixo.
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

    // decodificação escrubada: os caracteres à esquerda do cursor já são os reais, o
    // resto é símbolo. Versão em gsap.set do que o ScrambleTextPlugin faz tweenando —
    // aqui precisa andar e voltar com o scroll, e um tween por tick não faria isso.
    const GLYPHS = "!<>-_\\/[]{}—=+*^?#";
    const decode = (el: HTMLElement, k: number) => {
      const text = el.dataset.text ?? "";
      const shown = Math.round(k * text.length);
      if (shown >= text.length) {
        if (el.textContent !== text) el.textContent = text;
        return;
      }
      let out = text.slice(0, shown);
      for (let i = shown; i < text.length; i++) {
        // semeado pelo cursor, não pelo frame: os símbolos só trocam quando um caractere
        // novo entra — semear no tempo faria a coluna inteira tremer parada
        out += text[i] === " " ? " " : GLYPHS[(i * 7 + shown * 3) % GLYPHS.length];
      }
      // sendo semeado pelo cursor, a string se repete entre os frames em que ele não
      // anda; escrever mesmo assim invalidaria o layout do texto à toa
      if (el.textContent !== out) el.textContent = out;
    };

    // cada categoria é revelada por uma cortina que corre da esquerda pra direita (leva a
    // borda inferior junto, então a linha se desenha) enquanto o nome decodifica. Na saída
    // a cortina continua no mesmo sentido, saindo pela direita — entra e sai atravessando.
    // `names` já está em ordem de documento, então names[i] é o nome de cats[i].

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

    const onProjectsProgress = ((e: CustomEvent<{ progress: number }>) => {
      const t = e.detail.progress;
      enteredT = t;
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
      // o nome decodifica atrás da cortina, terminando depois dela: o texto ainda está
      // se resolvendo quando a linha já apareceu inteira
      cats.forEach((_, i) =>
        decode(names[i], reduceMotion ? 1 : seqT(gsap.utils.clamp(0, 1, (revealT - 0.2) / 0.8), i, cats.length)),
      );

      const ruleT = enterEase(gsap.utils.clamp(0, 1, (revealT - 0.42) / 0.28));
      gsap.set(rule, { opacity: ruleT, scaleX: ruleT });

      stagger(metaRows, gsap.utils.clamp(0, 1, (revealT - 0.55) / 0.45), (el, k) => {
        const e = enterEase(k);
        gsap.set(el, { opacity: e, y: gsap.utils.interpolate(14, 0, e) });
      });
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
        // o nome se desfaz em símbolo antes de a cortina chegar nele — a leitura some
        // primeiro, a linha depois
        cats.forEach((_, i) =>
          decode(names[i], reduceMotion ? 1 : 1 - seqT(exitLocalT(0, 0.45, et), i, cats.length)),
        );
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
      const fadeT = gsap.utils.clamp(0, 1, (p - EXIT_END) / 0.27);
      gsap.set(section, { opacity: 1 - fadeT, visibility: fadeT >= 1 ? "hidden" : "visible" });

      exiting = p > 0;
      window.dispatchEvent(new CustomEvent("skills:progress", { detail: { progress: p } }));
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);

    // microinteração: scramble no nome da categoria ao passar o mouse
    if (!reduceMotion) {
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
