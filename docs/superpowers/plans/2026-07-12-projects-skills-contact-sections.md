# Projects / Skills / Contact — Implementation Plan

**Goal:** Adicionar três seções novas (`Projects`, `Skills`, `Contact`) à pilha existente (`Hero → WhatIDo → AboutMe`), cada uma aparecendo e desaparecendo por completo antes da próxima, reaproveitando o motor de scroll já existente (`sectionStack.ts`), com microinterações e um visual "fora do padrão" na mesma identidade do resto do site.

**Architecture:** O site não usa scroll nativo nem ScrollTrigger/ScrollSmoother — `html,body{overflow:hidden}`, todas as seções são `position:fixed;inset:0`. `src/lib/sectionStack.ts` intercepta wheel/touch/pointer via GSAP `Observer` (`preventDefault:true`) e acumula um progresso contínuo (`state.value`, 0..N-1). Cada seção calcula seu progresso local (`clamp(0,1, state.value - i)`) e, a menos que tenha `data-no-close-clip`, fecha sozinha via `clip-path: inset()` até virar uma barra fina de `FINAL_WIDTH_VW` (5vw), completando aos `CLIP_CLOSE_T` (0.7) do seu progresso local, com um overlay preto (`getOverlay`) surgindo por cima. Cada seção escuta o evento `stack:progress` que `sectionStack.ts` dispara nela mesma pra reagir ao próprio fechamento, e redistribui um evento próprio (`{nome}:progress`) em `window` pra próxima seção usar como gatilho de entrada — é assim que `Hero` (`hero:bar-shrink`) já aciona `WhatIDo`, e `WhatIDo` (`whatido:progress`) já aciona `AboutMe`.

**Por que não ScrollTrigger:** não há posição de scroll real pra ele se prender — `Observer` já é dono do wheel/touch/pointer. `sectionStack.ts` já reimplementa a semântica de `scrub` manualmente (`gsap.quickTo` suavizando o progresso, eventos customizados fazendo o papel do `onUpdate`). Este plano estende esse mecanismo em vez de introduzir um segundo sistema de scroll competindo pelo mesmo input.

**Bug corrigido no caminho:** `AboutMe.astro` hoje não tem nenhuma animação de saída porque depende de ser a última seção da pilha (`sectionStack.ts` pula o fechamento da última). Ao inserir 3 seções depois dela, ela deixa de ser a última — o fechamento genérico por `clip-path` passa a valer automaticamente (ela não tem `data-no-close-clip`), mas sem finalização própria ela vira uma barra preta permanente por cima de tudo que vem depois. A Task 2 corrige isso.

**Tech Stack:** Astro 7, GSAP 3 (`gsap` v3.15, pós-fusão com a Webflow — todos os plugins bundlados de graça, sem `gsap-trial`; `ScrambleTextPlugin` confirmado em `node_modules/gsap/ScrambleTextPlugin.js`, usado pela primeira vez na Task 4), `parallax-js` (já usado em `WhatIDo.astro`), Tailwind CSS 4.

Não há framework de testes no projeto — verificação é manual, `npm run dev` + observação no navegador (incluindo `prefers-reduced-motion` via DevTools). Cada task termina com uma verificação manual explícita.

## Global Constraints

- Toda animação (interação, entrada, scroll) é feita com GSAP — não usar CSS `@keyframes`/`transition` pra isso, nem outra lib. Isso vale também pra hover/microinterações: nada de `:hover{transition:...}`, tudo via `mouseenter`/`mouseleave` + GSAP.
- `gsap.registerPlugin(...)` só uma vez por plugin (`ScrambleTextPlugin` registrado localmente no script de `Skills.astro`).
- Sempre checar `window.matchMedia("(prefers-reduced-motion: reduce)").matches` e pular pro estado final via `gsap.set(...)` quando reduzido. O handler de `stack:progress` (fechamento + finale + redispatch) é **incondicional** em todo componente (fora do `if/else` de reduced motion) — é o que evita a seção deixar um resíduo visual clipado permanente em qualquer um dos dois modos, mesmo idiom do handler de `Hero.astro`.
- Animar `transform`/`opacity` via GSAP, não propriedades de layout.
- Um componente = um arquivo `.astro`, estilos `<style>` escopados no mesmo arquivo, sem CSS Modules.
- BEM (`.bloco__elemento--modificador`).
- Comentários só pro "porquê" não óbvio (ver comentários `ponytail:` existentes).

**Nota sobre commits:** as tasks abaixo NÃO incluem passo de commit — as mudanças ficam no working tree pra revisão antes de qualquer commit, a pedido explícito do usuário no fluxo desta sessão.

---

### Task 1: `goToSection` em `sectionStack.ts`

**Files:**
- Modify: `src/lib/sectionStack.ts`

**Interfaces:**
- Produces: `goToSection(idOrIndex: string | number): void`, exportado, consumido pelo `Navbar.astro` na Task 6.

- [ ] **Step 1: Adicionar o export**

Ao final do arquivo, depois de `enableSectionStack`:

```ts
// permite navegação por clique (Navbar) sem duplicar a lista de seções —
// resolve o id contra o mesmo array `sections` que o Observer já usa, e
// escreve em `target` (não só em `moveTo`) porque é o acumulador cru que o
// onChange do Observer continua incrementando a partir daí; só chamar
// moveTo() sem atualizar target faria o próximo tick de wheel saltar de volta.
export function goToSection(idOrIndex: string | number) {
  const index =
    typeof idOrIndex === "number"
      ? idOrIndex
      : sections.findIndex((el) => el.id === idOrIndex);
  if (index < 0 || !moveTo) return;
  target = gsap.utils.clamp(0, max, index);
  moveTo(target);
}
```

- [ ] **Step 2: Verificação manual**

Nenhuma mudança visual ainda (função não é chamada por ninguém até a Task 6). Rodar `npm run dev`, confirmar que a home carrega e rola normalmente como antes, sem erros no console/build.

---

### Task 2: Corrigir a saída da `AboutMe.astro`

**Files:**
- Modify: `src/components/AboutMe.astro`

**Interfaces:**
- Consumes: `CLIP_CLOSE_T` de `../lib/sectionStack` (mesmo import que `WhatIDo.astro` já faz).
- Produces: evento `aboutme:progress` em `window`, consumido por `Projects.astro` na Task 3.

- [ ] **Step 1: Import e referência da seção**

No topo do `<script>`, junto do import existente:

```ts
import gsap from "gsap";
import { CLIP_CLOSE_T } from "../lib/sectionStack";
```

Logo após as outras `const ... = document.getElementById(...)`, adicionar:

```ts
const section = document.getElementById("aboutme-section")!;
```

- [ ] **Step 2: CSS — permitir o clip genérico**

No bloco `<style>`, na regra `.aboutme` existente, adicionar (reaproveita o mesmo par de propriedades que `.hero`/`.whatido` já declaram, necessário porque o `applyState()` do `sectionStack.ts` só escreve `clip-path` inline a partir do primeiro tick de scroll — sem esse default a seção renderiza sem clip-path nenhum entre o load da página e o primeiro input):

```css
  .aboutme {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    pointer-events: none;
    clip-path: inset(0% 0% 0% 0%);
    will-change: clip-path;
    /* ... resto da regra existente permanece igual ... */
  }
```

- [ ] **Step 3: Handler de saída incondicional**

Ao final do `<script>` (depois do bloco `if (reduceMotion) {...} else {...}` existente, no mesmo nível — não dentro de nenhum dos dois branches, mesmo posicionamento que `Hero.astro` usa pro seu próprio `stack:progress`):

```ts
// recolhe o conteúdo já revelado (mesma constante de aceleração exitT que o
// Hero usa) e esconde a seção por completo ao final — sem isso, a partir de
// agora que a AboutMe não é mais a última da pilha, o clip-path genérico do
// sectionStack a reduziria a uma barra fina que ficaria visível pra sempre
// por cima de Projects/Skills/Contact.
section.addEventListener("stack:progress", ((e: CustomEvent<{ progress: number }>) => {
  const p = e.detail.progress;
  const exitT = gsap.utils.clamp(0, 1, p * 1.8);
  gsap.set(revealTargets, { opacity: 1 - exitT, y: -exitT * 40 });
  gsap.set(portraitWrap, { scale: 1 - exitT * 0.08 });
  gsap.set(section, { display: p >= 1 ? "none" : "" });
  window.dispatchEvent(new CustomEvent("aboutme:progress", { detail: { progress: p } }));
}) as EventListener);
```

`revealTargets` e `portraitWrap` já existem como consts no script (`const revealTargets = [backdrop, glow1, glow2, word, portraitWrap, statement, bio, label];`) — reaproveitados, não duplicar array.

- [ ] **Step 4: Verificação manual**

`npm run dev`. Rolar até o fim da seção AboutMe (ainda sem Projects criada, então vai revelar tela vazia/próxima seção inexistente por enquanto — normal nesta task isolada). Confirmar: o conteúdo da AboutMe recolhe e a seção some (`display:none`) em vez de deixar uma barra preta fixa. Testar com `prefers-reduced-motion: reduce` emulado: conteúdo deve estar direto no estado final, e o `stack:progress` ainda deve recolher/esconder a seção ao rolar (é incondicional).

---

### Task 3: `Projects.astro` (novo)

**Files:**
- Create: `src/components/Projects.astro`

**Interfaces:**
- Consumes: evento `aboutme:progress` (Task 2).
- Produces: `id="projects-section"`, evento `projects:progress`, consumido por `Skills.astro` (Task 4).

- [ ] **Step 1: Criar o arquivo completo**

```astro
---
// ponytail: dados de projeto placeholder, trocar por projetos/imagens reais depois
const projects = [
  { index: "01", title: "Aurora", tag: "Motion / WebGL" },
  { index: "02", title: "Vórtice", tag: "Interação / GSAP" },
  { index: "03", title: "Prisma", tag: "3D / Three.js" },
  { index: "04", title: "Éter", tag: "Branding / Astro" },
].map((p) => ({ ...p, letters: p.title.split("") }));
---

<section class="projects fixed inset-0 h-screen w-screen" id="projects-section" data-stack>
  <div class="projects__label" id="projects-label">&lt;Trabalhos <span class="projects__label-slash">/</span>&gt;</div>
  <ul class="projects__list" id="projects-list">
    {projects.map((p, i) => (
      <li class="projects__row" id={`projects-row-${i}`}>
        <span class="projects__index">{`{ pj:${p.index} }`}</span>
        <h3 class="projects__title">
          {p.letters.map((ch) => (
            <span class="projects__letter-wrap"><span class="projects__letter">{ch}</span></span>
          ))}
          <span class="projects__title-underline" aria-hidden="true"></span>
        </h3>
        <span class="projects__tag">{p.tag}</span>
        <div class="projects__thumb" aria-hidden="true">
          <div class="projects__thumb-fill"></div>
          <div class="projects__thumb-scan"></div>
        </div>
      </li>
    ))}
  </ul>
</section>

<style>
  .projects {
    position: relative;
    background: #030303;
    display: flex;
    align-items: center;
    overflow: hidden;
    clip-path: inset(0% 0% 0% 0%);
    will-change: clip-path;
  }

  .projects__label {
    position: absolute;
    top: 11vh;
    left: 6vw;
    z-index: 1;
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 14px;
    color: #34d399;
    will-change: opacity;
  }

  .projects__label-slash {
    color: rgba(244, 247, 245, 0.55);
  }

  .projects__list {
    position: relative;
    z-index: 1;
    list-style: none;
    margin: 0;
    width: 100%;
    padding: 0 6vw;
  }

  .projects__row {
    position: relative;
    display: grid;
    grid-template-columns: 90px 1fr auto;
    align-items: baseline;
    gap: 2vw;
    padding: 2.4vh 0;
    border-bottom: 1px solid rgba(244, 247, 245, 0.12);
    will-change: transform, opacity;
  }

  .projects__index {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 13px;
    color: rgba(244, 247, 245, 0.45);
  }

  .projects__title {
    position: relative;
    margin: 0;
    display: flex;
    width: fit-content;
    font-family: "Cormorant Infant", serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(2.2rem, 4.6vw, 4.2rem);
    line-height: 1;
    color: #f4f7f5;
  }

  .projects__letter-wrap {
    display: inline-block;
    overflow: hidden;
    line-height: 1;
  }

  .projects__letter {
    display: inline-block;
    will-change: transform, opacity;
  }

  .projects__title-underline {
    position: absolute;
    left: 0;
    bottom: -0.08em;
    height: 2px;
    width: 100%;
    background: linear-gradient(90deg, #0891b2, #34d399);
    transform-origin: left center;
    transform: scaleX(0);
    will-change: transform;
  }

  .projects__tag {
    justify-self: end;
    font-family: "Space Grotesk", sans-serif;
    font-size: clamp(0.7rem, 1vw, 0.85rem);
    color: rgba(244, 247, 245, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .projects__thumb {
    position: absolute;
    right: 6vw;
    top: 50%;
    width: clamp(140px, 16vw, 260px);
    height: clamp(90px, 10vw, 165px);
    transform: translateY(-50%);
    overflow: hidden;
    border-radius: 6px;
    clip-path: inset(50% 0% 50% 0%);
    pointer-events: none;
    will-change: clip-path;
  }

  .projects__thumb-fill {
    position: absolute;
    inset: -8% -6%;
    background:
      url("/noise.png"),
      radial-gradient(120% 85% at 30% 20%, rgba(126, 244, 192, 0.28), rgba(0, 0, 0, 0) 56%),
      linear-gradient(155deg, #0f3b34, #072220 60%, #030807);
    background-repeat: repeat, no-repeat, no-repeat;
    background-blend-mode: overlay, screen, normal;
  }

  .projects__thumb-scan {
    position: absolute;
    inset: 0;
    background: #fff;
    mix-blend-mode: difference;
    opacity: 0;
  }

  @media (max-width: 640px) {
    .projects__row {
      grid-template-columns: 60px 1fr;
    }
    .projects__tag {
      grid-column: 2;
      justify-self: start;
    }
    .projects__thumb {
      display: none;
    }
  }
</style>

<script>
  import gsap from "gsap";

  const section = document.getElementById("projects-section")!;
  const label = document.getElementById("projects-label")!;
  const rows = Array.from(document.querySelectorAll<HTMLElement>(".projects__row"));

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

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

    const revealProgress = { value: 0 };
    const setProgress = gsap.quickTo(revealProgress, "value", {
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => reveal.progress(revealProgress.value),
    });

    window.addEventListener("aboutme:progress", ((e: CustomEvent<{ progress: number }>) => {
      setProgress(e.detail.progress);
    }) as EventListener);

    // microinteracoes: pull magnetico na linha, thumb com wipe + scan no hover,
    // faixa sob o titulo — tudo via GSAP (mouseenter/mouseleave), sem CSS transition
    rows.forEach((row) => {
      const thumb = row.querySelector<HTMLElement>(".projects__thumb");
      const scan = row.querySelector<HTMLElement>(".projects__thumb-scan");
      const underline = row.querySelector<HTMLElement>(".projects__title-underline");
      const moveX = gsap.quickTo(row, "x", { duration: 0.5, ease: "power3" });

      row.addEventListener("mousemove", (e) => {
        const rect = row.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        moveX(dx * 12);
      });

      row.addEventListener("mouseenter", () => {
        gsap.to(thumb, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.out" });
        gsap.to(underline, { scaleX: 1, duration: 0.4, ease: "power3.out" });
        gsap.fromTo(
          scan,
          { opacity: 0.5, yPercent: 100 },
          { opacity: 0, yPercent: -100, duration: 0.6, ease: "power2.out" },
        );
      });
      row.addEventListener("mouseleave", () => {
        moveX(0);
        gsap.to(thumb, { clipPath: "inset(50% 0% 50% 0%)", duration: 0.4, ease: "power2.inOut" });
        gsap.to(underline, { scaleX: 0, duration: 0.3, ease: "power2.inOut" });
      });
    });
  }

  // fechamento: recolhe cedo, finale "chicote" (skew/scale) tingido pra paleta
  // de Skills, esconde ao final — incondicional, mesmo motivo do fix na AboutMe
  section.addEventListener("stack:progress", ((e: CustomEvent<{ progress: number }>) => {
    const p = e.detail.progress;
    const exitT = gsap.utils.clamp(0, 1, p * 1.6);
    gsap.set(rows, { opacity: 1 - exitT, x: -exitT * 60 });
    gsap.set(label, { opacity: 1 - exitT });

    const CLIP_CLOSE_T = 0.7;
    const flickT = gsap.utils.clamp(0, 1, (p - CLIP_CLOSE_T) / (1 - CLIP_CLOSE_T));
    const flickShape = Math.sin(flickT * Math.PI);
    gsap.set(section, {
      skewX: flickShape * 6,
      scaleY: 1 + flickShape * 0.06,
      display: p >= 1 ? "none" : "",
    });

    window.dispatchEvent(new CustomEvent("projects:progress", { detail: { progress: p } }));
  }) as EventListener);
</script>
```

- [ ] **Step 2: Verificação manual**

`npm run dev`, adicionar temporariamente `<Projects />` em `index.astro` (ou aguardar a Task 7) e rolar até ela: confirmar entrada em cascata das linhas/letras, hover revelando thumbnail + scan + underline, pull magnético seguindo o mouse, fechamento sem barra residual. Testar reduced motion.

---

### Task 4: `Skills.astro` (novo)

**Files:**
- Create: `src/components/Skills.astro`

**Interfaces:**
- Consumes: evento `projects:progress` (Task 3).
- Produces: `id="skills-section"`, evento `skills:progress`, consumido por `Contact.astro` (Task 5).

- [ ] **Step 1: Criar o arquivo completo**

```astro
---
// ponytail: categorias/tags placeholder, ajustar conforme stack real evoluir
const categories = [
  { name: "Frontend", tags: ["Astro", "Tailwind CSS", "TypeScript", "Vite"] },
  { name: "Animação & 3D", tags: ["GSAP", "Three.js", "WebGL", "Blender"] },
  { name: "Ferramentas", tags: ["Figma", "Git", "Sanity", "Vercel"] },
  { name: "Performance", tags: ["Lighthouse", "Core Web Vitals", "Lazy Loading", "A11y"] },
];
---

<section class="skills fixed inset-0 h-screen w-screen" id="skills-section" data-stack>
  <div class="skills__grid" id="skills-grid" data-depth="0.15" aria-hidden="true"></div>
  <div class="skills__label" id="skills-label">&lt;Skills <span class="skills__label-slash">/</span>&gt;</div>
  <div class="skills__panels" id="skills-panels">
    {categories.map((cat, i) => (
      <div class="skills__panel" id={`skills-panel-${i}`}>
        <h3 class="skills__heading" data-text={cat.name}>{cat.name}</h3>
        <div class="skills__tags">
          {cat.tags.map((tag) => (
            <span class="skills__tag" data-text={tag}>{tag}</span>
          ))}
        </div>
      </div>
    ))}
  </div>
</section>

<style>
  .skills {
    position: relative;
    background: #030b09;
    display: flex;
    align-items: center;
    overflow: hidden;
    clip-path: inset(0% 0% 0% 0%);
    will-change: clip-path;
  }

  .skills__grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(rgba(244, 247, 245, 0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244, 247, 245, 0.018) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    transform-origin: center;
    will-change: transform, opacity;
  }

  .skills__label {
    position: absolute;
    top: 11vh;
    left: 6vw;
    z-index: 1;
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 14px;
    color: #34d399;
    will-change: opacity;
  }

  .skills__label-slash {
    color: rgba(244, 247, 245, 0.55);
  }

  .skills__panels {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4vw 5vw;
    width: 100%;
    padding: 0 8vw;
  }

  .skills__panel {
    will-change: transform, opacity;
  }

  .skills__heading {
    margin: 0 0 1rem;
    font-family: "Space Grotesk", sans-serif;
    font-weight: 700;
    font-size: clamp(1rem, 1.6vw, 1.3rem);
    letter-spacing: 0.02em;
    color: #f4f7f5;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(244, 247, 245, 0.15);
  }

  .skills__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .skills__tag {
    padding: 0.4rem 0.9rem;
    border: 1px solid rgba(244, 247, 245, 0.25);
    border-radius: 999px;
    font-family: "Space Grotesk", sans-serif;
    font-size: clamp(0.75rem, 1vw, 0.85rem);
    color: rgba(244, 247, 245, 0.75);
    cursor: default;
    will-change: transform, opacity, border-color;
  }

  @media (max-width: 900px) {
    .skills__panels {
      grid-template-columns: 1fr;
      gap: 5vh;
    }
  }
</style>

<script>
  import gsap from "gsap";
  import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
  import Parallax from "parallax-js";

  gsap.registerPlugin(ScrambleTextPlugin);

  const section = document.getElementById("skills-section")!;
  const grid = document.getElementById("skills-grid")!;
  const label = document.getElementById("skills-label")!;
  const panels = Array.from(document.querySelectorAll<HTMLElement>(".skills__panel"));
  const headings = Array.from(document.querySelectorAll<HTMLElement>(".skills__heading"));
  const tags = Array.from(document.querySelectorAll<HTMLElement>(".skills__tag"));

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

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

    window.addEventListener("projects:progress", ((e: CustomEvent<{ progress: number }>) => {
      setProgress(e.detail.progress);
    }) as EventListener);

    // microinteracao: glitch/scramble ao passar o mouse sobre cada tag
    tags.forEach((tag) => {
      tag.addEventListener("mouseenter", () => {
        gsap.to(tag, {
          duration: 0.5,
          scrambleText: { text: tag.dataset.text ?? tag.textContent ?? "", chars: "upperAndLowerCase", speed: 0.5 },
          borderColor: "rgba(52, 211, 153, 0.7)",
          ease: "none",
        });
      });
      tag.addEventListener("mouseleave", () => {
        gsap.to(tag, { borderColor: "rgba(244, 247, 245, 0.25)", duration: 0.4 });
      });
    });

    new Parallax(section, { relativeInput: true, hoverOnly: true, selector: "[data-depth]" });
  }

  // fechamento incondicional: recolhe cedo, alguns jitters de skew (glitch),
  // esconde ao final, redistribui pra Contact
  section.addEventListener("stack:progress", ((e: CustomEvent<{ progress: number }>) => {
    const p = e.detail.progress;
    const exitT = gsap.utils.clamp(0, 1, p * 1.6);
    gsap.set(panels, { opacity: 1 - exitT, y: -exitT * 30 });
    gsap.set([grid, label], { opacity: 1 - exitT });

    const CLIP_CLOSE_T = 0.7;
    const glitchT = gsap.utils.clamp(0, 1, (p - CLIP_CLOSE_T) / (1 - CLIP_CLOSE_T));
    const jitter = Math.sin(glitchT * Math.PI * 6) * (1 - glitchT);
    gsap.set(section, {
      x: jitter * 6,
      skewX: jitter * 3,
      display: p >= 1 ? "none" : "",
    });

    window.dispatchEvent(new CustomEvent("skills:progress", { detail: { progress: p } }));
  }) as EventListener);
</script>
```

- [ ] **Step 2: Verificação manual**

Rolar da Projects até a Skills: confirmar grid de fundo com parallax no mouse, painéis entrando em cascata, scramble-in nos títulos das categorias, hover nas tags disparando glitch de texto + borda, fechamento com jitter sem resíduo. Testar reduced motion (sem scramble, tudo no estado final).

---

### Task 5: `Contact.astro` (novo)

**Files:**
- Create: `src/components/Contact.astro`

**Interfaces:**
- Consumes: evento `skills:progress` (Task 4).
- Produces: `id="contact-section"`, última da pilha — sem `data-no-close-clip` necessário e sem `stack:progress`/finale/redispatch (o guard `if (i === sections.length - 1) return` do `sectionStack.ts` já cobre, mesmo caso que a `AboutMe` tinha antes de deixar de ser a última).

- [ ] **Step 1: Criar o arquivo completo**

```astro
---
const socials = [
  { label: "LinkedIn", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Email", href: "mailto:dinamous.dev@gmail.com" },
];
const headline = "Vamos criar movimento".split("");
---

<section class="contact fixed inset-0 h-screen w-screen" id="contact-section" data-stack>
  <div class="contact__glow" id="contact-glow" aria-hidden="true"></div>
  <div class="contact__inner">
    <h2 class="contact__headline" id="contact-headline">
      {headline.map((ch) => (
        <span class="contact__letter-wrap"><span class="contact__letter">{ch === " " ? " " : ch}</span></span>
      ))}<span class="contact__accent">;</span>
    </h2>
    <a class="contact__mail" id="contact-mail" href="mailto:dinamous.dev@gmail.com">
      dinamous.dev@gmail.com
      <span class="contact__mail-underline" aria-hidden="true"></span>
    </a>
    <ul class="contact__social" id="contact-social">
      {socials.map((s) => (
        <li><a href={s.href} target={s.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener">{s.label}</a></li>
      ))}
    </ul>
  </div>
  <div class="contact__tag" id="contact-tag">{"{ eof }"}</div>
</section>

<style>
  .contact {
    position: relative;
    background: #030303;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .contact__glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 90vw;
    height: 90vw;
    max-width: 1100px;
    max-height: 1100px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(52, 211, 153, 0.16),
      rgba(8, 145, 178, 0.08) 45%,
      rgba(0, 0, 0, 0) 72%
    );
    filter: blur(20px);
    will-change: transform, opacity;
  }

  .contact__inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.4rem;
    text-align: center;
  }

  .contact__headline {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    font-family: "Cormorant Infant", serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(2.4rem, 6vw, 5.5rem);
    line-height: 1;
    color: #f4f7f5;
  }

  .contact__letter-wrap {
    display: inline-block;
    overflow: hidden;
    line-height: 1;
  }

  .contact__letter {
    display: inline-block;
    will-change: transform, opacity;
  }

  .contact__accent {
    color: #34d399;
    will-change: transform, opacity;
  }

  .contact__mail {
    position: relative;
    display: inline-block;
    padding-bottom: 2px;
    font-family: "Space Grotesk", sans-serif;
    font-weight: 500;
    font-size: clamp(1rem, 1.6vw, 1.3rem);
    color: rgba(244, 247, 245, 0.75);
    text-decoration: none;
    will-change: transform, opacity;
  }

  .contact__mail-underline {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: #34d399;
    transform-origin: left center;
    transform: scaleX(0);
    will-change: transform;
  }

  .contact__social {
    display: flex;
    list-style: none;
    gap: 1rem;
    margin: 0;
    padding: 0;
    will-change: transform, opacity;
  }

  .contact__social li:not(:first-child)::before {
    content: "/";
    margin-right: 1rem;
    color: rgba(244, 247, 245, 0.4);
  }

  .contact__social a {
    position: relative;
    color: rgba(244, 247, 245, 0.6);
    text-decoration: none;
    text-transform: uppercase;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  .contact__tag {
    position: absolute;
    bottom: 6vh;
    left: 50%;
    transform: translateX(-50%);
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12px;
    color: rgba(52, 211, 153, 0.7);
    will-change: transform, opacity;
  }

  @media (max-width: 640px) {
    .contact__social {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>

<script>
  import gsap from "gsap";

  const glow = document.getElementById("contact-glow")!;
  const headline = document.getElementById("contact-headline")!;
  const mail = document.getElementById("contact-mail")!;
  const mailUnderline = mail.querySelector<HTMLElement>(".contact__mail-underline")!;
  const social = document.getElementById("contact-social")!;
  const tag = document.getElementById("contact-tag")!;
  const letters = headline.querySelectorAll<HTMLElement>(".contact__letter");
  const accent = headline.querySelector<HTMLElement>(".contact__accent")!;
  const revealTargets = [mail, social, tag];

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion) {
    gsap.set(letters, { y: 0, opacity: 1 });
    gsap.set(accent, { opacity: 1, scale: 1 });
    gsap.set(revealTargets, { opacity: 1, y: 0 });
    gsap.set(glow, { opacity: 1 });
  } else {
    gsap.set(letters, { yPercent: 110, opacity: 0 });
    gsap.set(accent, { opacity: 0, scale: 0.4 });
    gsap.set(revealTargets, { opacity: 0, y: 16 });
    gsap.set(glow, { opacity: 0 });

    const reveal = gsap
      .timeline({ paused: true })
      .to(glow, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
      .to(letters, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.02, ease: "power3.out" }, 0.1)
      .to(accent, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, "-=0.2")
      .to(revealTargets, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.2");

    const revealProgress = { value: 0 };
    const setProgress = gsap.quickTo(revealProgress, "value", {
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => reveal.progress(revealProgress.value),
    });

    window.addEventListener("skills:progress", ((e: CustomEvent<{ progress: number }>) => {
      setProgress(e.detail.progress);
    }) as EventListener);

    // ultima secao da pilha: sem stack:progress/finale — sectionStack nunca
    // fecha a ultima (mesmo guard que a AboutMe usava antes da Task 2)

    // loop ambiente (cena de repouso final): respiracao do glow + paralaxe
    // sutil no mousemove, mesmo idiom que AboutMe.astro ja usa
    gsap.to(glow, { scale: 1.08, duration: 4, yoyo: true, repeat: -1, ease: "sine.inOut" });

    const glowX = gsap.quickTo(glow, "x", { duration: 1.2, ease: "power3" });
    const glowY = gsap.quickTo(glow, "y", { duration: 1.2, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      glowX(-dx * 40);
      glowY(-dy * 30);
    });

    // microinteracao: pull magnetico + underline wipe no mail/socials
    mail.addEventListener("mouseenter", () =>
      gsap.to(mailUnderline, { scaleX: 1, duration: 0.3, ease: "power2.out" }),
    );
    mail.addEventListener("mouseleave", () =>
      gsap.to(mailUnderline, { scaleX: 0, duration: 0.25, ease: "power2.inOut" }),
    );

    [mail, ...Array.from(social.querySelectorAll<HTMLElement>("a"))].forEach((el) => {
      const moveX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
      const moveY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        moveX(((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 10);
        moveY(((e.clientY - (rect.top + rect.height / 2)) / rect.height) * 6);
      });
      el.addEventListener("mouseleave", () => {
        moveX(0);
        moveY(0);
      });
    });
  }
</script>
```

- [ ] **Step 2: Verificação manual**

Rolar da Skills até o final: confirmar reveal do headline letra-a-letra + `;` de assinatura, glow respirando continuamente em repouso, paralaxe do glow seguindo o mouse, pull magnético + underline no mail/socials. Confirmar que rolar além do fim não quebra nada (última seção, sem fechamento).

---

### Task 6: `Navbar.astro` — link Skills + navegação por clique

**Files:**
- Modify: `src/components/Navbar.astro`

**Interfaces:**
- Consumes: `goToSection` de `../lib/sectionStack` (Task 1).

- [ ] **Step 1: Markup — adicionar Skills e corrigir hrefs**

Trocar o bloco `.navbar__pages` atual:

```astro
    <ul class="navbar__pages">
      <li><a href="#sobre">Sobre</a></li>
      <li><a href="#trabalhos">Trabalhos</a></li>
      <li><a href="#contato">Contato</a></li>
    </ul>
```

por:

```astro
    <ul class="navbar__pages">
      <li><a href="#aboutme-section">Sobre</a></li>
      <li><a href="#projects-section">Trabalhos</a></li>
      <li><a href="#skills-section">Skills</a></li>
      <li><a href="#contact-section">Contato</a></li>
    </ul>
```

- [ ] **Step 2: Script — import + handler de clique**

No `<script>` existente, junto do import de `gsap`:

```ts
import gsap from "gsap";
import { goToSection } from "../lib/sectionStack";
```

Adicionar (pode ficar logo após a declaração de `items`, antes do `reduceMotion`):

```ts
document.querySelectorAll<HTMLAnchorElement>(".navbar__pages a").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    goToSection(a.getAttribute("href")!.slice(1));
  });
});
```

`.navbar__social` (LinkedIn/GitHub/Email) fica intocado — são links externos/mailto, não navegação interna.

- [ ] **Step 2: Verificação manual**

`npm run dev`, clicar em cada link do menu (Sobre/Trabalhos/Skills/Contato) e confirmar que a pilha salta pra seção certa. Testar clique no meio de uma transição em andamento (não deve travar o `Observer`).

---

### Task 7: Ligar tudo em `index.astro`

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Imports + composição**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Hero from "../components/Hero.astro";
import WhatIDo from "../components/WhatIDo.astro";
import AboutMe from "../components/AboutMe.astro";
import Projects from "../components/Projects.astro";
import Skills from "../components/Skills.astro";
import Contact from "../components/Contact.astro";
---

<BaseLayout title="Matheus Simões, Motion Frontend">
  <Hero />
  <WhatIDo />
  <AboutMe />
  <Projects />
  <Skills />
  <Contact />
</BaseLayout>
```

Nenhuma mudança em `BaseLayout.astro` — `initSectionStack()` já descobre `[data-stack]` genericamente pela ordem do DOM.

- [ ] **Step 2: Verificação manual — passagem completa**

`npm run dev`. Rolar (wheel) do topo até o fim, sem pular: confirmar que as 6 seções aparecem e desaparecem em sequência, sem sobreposição/fantasma em nenhuma transição (checar especialmente AboutMe → Projects, o ponto do bug corrigido na Task 2). Rolar de volta (reverso) e conferir que desfaz suavemente em ambas direções. Clicar cada link do Navbar. Emular `prefers-reduced-motion: reduce` e recarregar — todas as 6 seções devem aparecer prontas no estado final, sem timelines. Redimensionar pros breakpoints 900px/640px. Checar console por erros durante toda a navegação.

## Self-Review Notes

- Cadeia de eventos fechada ponta a ponta: `hero:bar-shrink` → `whatido:progress` → `aboutme:progress` (novo) → `projects:progress` (novo) → `skills:progress` (novo) → Contact (sem redispatch, é a última).
- Todo handler de `stack:progress` novo/corrigido é incondicional (fora do `if/else` de reduced motion), evitando o bug de barra residual em ambos os modos.
- Nenhuma CSS `transition`/`@keyframes` nova — todas as microinterações (magnetismo, underline, scramble, scan) via GSAP `mouseenter`/`mouseleave`/`quickTo`, conforme a regra do projeto.
- Nenhuma dependência nova — `ScrambleTextPlugin` já vem embutido no pacote `gsap` instalado (v3.15, pós-fusão), só precisa import + `registerPlugin` local.
- Sem placeholders de código — todo trecho acima é completo e copiável; os dados de projetos/skills são placeholders de conteúdo (marcados `ponytail:`), não placeholders de implementação.

## Revisão pós-implementação (correções aplicadas depois do plano inicial)

Dois problemas apareceram ao testar de verdade e foram corrigidos diretamente no código (não refletidos no texto das tasks acima):

1. **`WhatIDo.astro` bloqueava Projects/Skills/Contact.** `WhatIDo` tem `data-no-close-clip` e nunca precisou se esconder (a cortina da AboutMe sempre cobria por cima, `z-index:20 !important` sempre vencia). Com seções empilhadas depois da AboutMe, o `z-index` natural de `WhatIDo` (mais alto que Projects/Skills/Contact) passou a cobrir todas elas pra sempre, mesmo com o conteúdo delas animando certinho por baixo. Corrigido com um `stack:progress` incondicional em `WhatIDo.astro` que esconde a seção (`display:none`) quando seu próprio progresso local chega a 1.
2. **Cada seção nova tinha que ter sua própria identidade de saída, não repetir o wipe genérico do Hero.** `AboutMe`, `Projects` e `Skills` ganharam `data-no-close-clip` (saem do fechamento genérico por `clip-path` do `sectionStack.ts`) e cada uma define sua própria transição de saída via `stack:progress`, todas terminando num fade da seção inteira (não só do conteúdo) pra revelar a próxima sem corte seco antes do `display:none`:
   - **AboutMe → Projects**: conteúdo pessoal recolhe primeiro, cena fica só com a cortina preta sólida, depois dissolve inteira (fade cinematográfico).
   - **Projects → Skills**: linhas da lista saem em cascata (stagger) pra esquerda, fundo sólido da seção desvanece só no fim da faixa.
   - **Skills → Contact**: títulos/tags viram símbolos por um instante (reaproveitando o `ScrambleTextPlugin` já carregado ali — glitch), depois todo o painel desvanece.
